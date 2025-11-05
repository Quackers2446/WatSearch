`timescale 1ns/1ps

/*
 * File:    credit_bp_tx.sv
 * Brief:   Credit based backpressure, transmitter side
 *
 * Copyright:
 *  Copyright (C) 2019 Gurshaant Singh Malik, Nachiket Kapre
 *  Copyright (C) 2024 Nachiket Kapre
 *  Copyright (C) 2024 John Jekel
 * See the README.md file at the root of the repo for licensing info.
 *
 * This recieves sends a packet over the noc_if and receives credit info back.
 * It provides a DVR backpressure scheme for the t/pi switch router depending
 * on how many credits it has.
 *
 * This replaces the switch output registers with one half of the credit backpressure mechanism.
 *
 * TODO will need to be invasive and replace the output registers and backpressure logic in t_switch.v
 * and pi_switch.v that are baked in (compared to bp.v which was a separate module)
 *
*/

/* ------------------------------------------------------------------------------------------------
 * Module Definition
 * --------------------------------------------------------------------------------------------- */

module credit_bp_tx
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
    
    //Connection to the receiver 
    noc_if.transmitter to_rx,

    //DVR interface from the switch routing logic
    input   logic [VC_W-1:0]            i_v,//One valid signal per VC
    input   logic [X_W-1:0]             i_x,//One valid signal per VC
    input   logic [Y_W-1:0]             i_y,//One valid signal per VC
    input   logic [D_W-1:0]             i_d,//Data, addressare per VC; assume the switch has arbitrated this
    output  logic [VC_W-1:0]            o_b //And so too are the backpressure signals
);

generate
    for (genvar ii = 0; ii < VC_W; ++ii) begin : gen_vc_logic
        logic [$clog2(DEPTH)-1:0]   credits;
        logic                       has_credit;

        always_ff @(posedge clk) begin
            if (rst) begin
                credits <= ($clog2(DEPTH))'(DEPTH - 1);
            end else begin
                if (to_rx.vc_target[ii] & to_rx.vc_credit_gnt[ii]) begin
                    //No credit update since we spent and received one on the same cycle
                end else if (to_rx.vc_target[ii]) begin
                    credits <= credits - 1;//Spending a credit
                end else if (to_rx.vc_credit_gnt[ii]) begin
                    credits <= credits + 1;//Receiving a credit
                end
            end
        end

        //DVR backpressure conversion
        assign has_credit          = |credits;
        assign to_rx.vc_target[ii] = i_v[ii] & has_credit;
        assign o_b[ii]             = !has_credit;
    end : gen_vc_logic
endgenerate

assign to_rx.packet.payload.data   = i_d;
assign to_rx.packet.routeinfo.addr = {i_x, i_y};

/* ------------------------------------------------------------------------------------------------
 * Assertions
 * --------------------------------------------------------------------------------------------- */

`ifdef SIMULATION

//Per VC assertions
generate
for (genvar ii = 0; ii < VC_W; ++ii) begin : gen_vc_assertions
    //Don't go over the max number of credits
    assert property (@(posedge clk) disable iff (rst) (gen_vc_logic[ii].credits <= ($clog2(DEPTH))'(DEPTH - 1)));

    //Don't underflow the credit count
    assert property (@(posedge clk) disable iff (rst) !(
        (gen_vc_logic[ii].credits == 0) && (to_rx.vc_target[ii] & !to_rx.vc_credit_gnt[ii])
    ));

    //If we're transmitting, that must mean we have at least one credit, else it's bad times
    assert property (@(posedge clk) disable iff (rst) (to_rx.vc_target[ii] |-> gen_vc_logic[ii].has_credit));

end : gen_vc_assertions
endgenerate

//Global assertions

//Control signals should be known out of reset
assert property (@(posedge clk) disable iff (rst) (!$isunknown(i_v)));
assert property (@(posedge clk) disable iff (rst) (!$isunknown(o_b)));

assert property (@(posedge clk) disable iff (rst) ($onehot0(i_v)));

//Qualified data shouldn't be unknown when valid
assert property (@(posedge clk) disable iff (rst) (|i_v |-> !$isunknown(i_d)));
//(There are already output assertions in noc_if.sv)

`endif //SIMULATION

endmodule : credit_bp_tx
