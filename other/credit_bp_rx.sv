`timescale 1ns/1ps

/*
 * File:    credit_bp_rx.sv
 * Brief:   Credit based backpressure, reciever side
 *
 * Copyright:
 *  Copyright (C) 2019 Gurshaant Singh Malik, Nachiket Kapre
 *  Copyright (C) 2024 Nachiket Kapre
 *  Copyright (C) 2024 John Jekel
 * See the README.md file at the root of the repo for licensing info.
 *
 * Based on bp.v
 *
 * This recieves a payload from the noc_if and sends credit info back out
 * It then converts this to a DVR backpressure scheme for the t/pi switch router
 *
 * This replaces the 2:1 mux and shadow register combination with one half
 * of the credit backpressure mechanism
 *
*/

/* ------------------------------------------------------------------------------------------------
 * Module Definition
 * --------------------------------------------------------------------------------------------- */

module credit_bp_rx
    import common_pkg::*;
#(
    parameter VC_W  = DEFAULT_VC_W,
    parameter D_W   = DEFAULT_D_W,
    parameter X_W   = DEFAULT_X_W,
    parameter Y_W   = DEFAULT_Y_W,
    parameter A_W   = X_W+Y_W,
    parameter DEPTH = DEFAULT_VC_FIFO_DEPTH//Actual depth is this - 1
) (
    //Clock and reset
    input logic clk,
    input logic rst,
    
    //Connection to the transmitter
    noc_if.receiver from_tx,

    //DVR interface to the switch routing logic
    output  logic [VC_W-1:0]            o_v, //Valid, one hot for vc chosen in this round robin
    output  logic [X_W-1:0]             o_x, //Data, address, for chosen vc
    output  logic [Y_W-1:0]             o_y, 
    output  logic [D_W-1:0]             o_d, 
    input   logic                       i_b  //Ready signal per VC
);

logic [VC_W-1:0] req;
logic [VC_W-1:0][D_W+X_W+Y_W-1:0] rdata_e; //external rdata for loop to make verilator happy :)

generate
    for (genvar ii = 0; ii < VC_W; ++ii) begin : gen_vc_logic
        //Push interface, 1-cycle latency
        logic               push;
        //No need for the `full` signal, since we have credits!
        logic [X_W+Y_W+D_W-1:0]   wdata;

        //Pop interface, 1-cycle latency
        logic               pop;
        logic [X_W+Y_W+D_W-1:0]   rdata;

        logic               empty;

        //The fifo itself! :)
        fifo32 #(
            .DEPTH32(DEPTH / 32),
            .WIDTH(X_W + Y_W + D_W),
            .RLATENCY(0)
        ) vc_fifo (
            //Clock and reset
            .clk(clk),
            .rst(rst),

            //Push interface, 1-cycle latency
            .i_push(push),
            //verilator lint_save
            //verilator lint_off PINCONNECTEMPTY
            .o_full(),//NU
            //verilator lint_restore
            .i_wdata(wdata),

            //Pop interface, 1-cycle latency
            .i_pop(pop),
            .o_empty(empty),
            .o_rdata(rdata)
        );

        //Credit logic
        always_comb begin
            push                        = from_tx.vc_target[ii];
            wdata                       = {from_tx.packet.routeinfo.addr, from_tx.packet.payload.data};
            from_tx.vc_credit_gnt[ii]   = pop;//Whenever we pop, we free up space so we can grant a credit!
        end

        //DVR connections to the switch routing logic
        always_comb begin
            pop     = !i_b & !empty & grant[ii]; //pop if granted and not backpressured
            o_v[ii] = !empty & grant[ii]; //not empty and grant is valid output!
            req[ii] = !empty; //request for grant when not empty
            rdata_e[ii] = rdata;
        end
    end : gen_vc_logic
endgenerate

always_comb
begin
    o_x = 0;
    o_y = 0;
    o_d = 0;
    //fixed iteration loop -> synthesizable
    for(int j = 0; j < VC_W; j++) begin
        if (grant[j]) begin //read from granted
            o_d = rdata_e[j][D_W-1:0];
            o_y = rdata_e[j][Y_W+D_W-1:D_W];
            o_x = rdata_e[j][X_W+Y_W+D_W-1:Y_W+D_W];
        end 
    end
end

reg [VC_W-1:0] grant;

matrix_arbiter #(.REQUEST_LINES(VC_W)) 
    arb(.rst(rst), 
        .clk(clk), 
        .en(1), 
        .req(req), 
        .grant(grant)
    );

/* ------------------------------------------------------------------------------------------------
 * Assertions
 * --------------------------------------------------------------------------------------------- */

`ifdef SIMULATION

//Per VC assertions
generate
for (genvar ii = 0; ii < VC_W; ++ii) begin : gen_vc_assertions
    //Credits should be respected by credit_bp_tx!
    assert property (@(posedge clk) disable iff (rst) !(gen_vc_logic[ii].push && gen_vc_logic[ii].vc_fifo.o_full));

    //We shouldn't pop even without backpressure unless there's actually something to pop
    assert property (@(posedge clk) disable iff (rst) !(gen_vc_logic[ii].empty && gen_vc_logic[ii].pop));

    //Qualified data shouldn't be unknown when valid
    //(There are already input assertions in noc_if.sv)
    assert property (@(posedge clk) disable iff (rst) (o_v[ii] |-> !$isunknown(o_d[ii])));

end : gen_vc_assertions
endgenerate

//Global assertions

//Control signals should be known out of reset
assert property (@(posedge clk) disable iff (rst) (!$isunknown(o_v)));
assert property (@(posedge clk) disable iff (rst) (!$isunknown(i_b)));

`endif //SIMULATION

endmodule : credit_bp_rx
