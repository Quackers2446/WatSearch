`timescale 1ns/1ps

//pure hoplite_bp with no fifo from W->S

module torus_switch_credit #(
    parameter VC_W  = 3,                // Virtual Channel Width
    parameter X_W	= 2,	            // X address width
    parameter Y_W	= 2,	            // Y address width
    parameter D_W	= 32,	            // data width
    parameter X_MAX	= 1<<X_W,
    parameter Y_MAX	= 1<<Y_W,
    parameter X	= 2,	                // X address of this node
    parameter Y	= 2,		                // Y address of this node
    parameter DEPTH = 32
) (
    input  logic clk,		            // clock
    input  logic rst,		            // reset

    input  logic i_v,	                // in valid
    input  logic [X_W-1:0] i_x,	        // in x
    input  logic [Y_W-1:0] i_y,	        // in y
    input  logic [D_W-1:0] i_data,	    // in data
    input  logic [VC_W-1:0] i_vc,        // one hot vc encoding
    input  logic [VC_W-1:0] i_b,         // client backpressure

    output logic i_ack,		            // input accepted this cycle
    output logic o_v,
    output logic [X_W-1:0] o_out_x,
    output logic [Y_W-1:0] o_out_y,
    output logic [D_W-1:0] o_out_data,

    noc_if.transmitter to_east_rx,
    noc_if.receiver from_west_tx,

    noc_if.transmitter to_south_rx,
    noc_if.receiver from_north_tx,

    output logic done
);

// Your lab3 code here
  
`define last    [X_W+Y_W+D_W]
`define x		[X_W+Y_W+D_W-1 : Y_W+D_W]
`define y		[    Y_W+D_W-1 :     D_W]
`define d		[        D_W-1 :       0]
`define addr    [X_W+Y_W+D_W-1 :     D_W]
`define Msg_W   (X_W+Y_W+D_W+1)

localparam int MSG_W = X_W + Y_W + D_W;

logic [VC_W-1:0] e_b, s_b;
logic w_b, n_b;

logic [VC_W-1:0] w_in_v, n_in_v;
logic [X_W-1:0]  w_in_x, n_in_x;
logic [Y_W-1:0]  w_in_y, n_in_y;
logic [D_W-1:0]  w_in_data, n_in_data;

logic [VC_W-1:0] e_v, s_v;
logic w2e, w2s, n2s;

logic [MSG_W-1:0] e_out_c, s_out_c;


// wiring up credit interfaces
credit_bp_tx #(.VC_W(VC_W), .D_W(D_W), .X_W(X_W), .Y_W(Y_W), .A_W(X_W+Y_W), .DEPTH(DEPTH))
    east_conn_tx(.clk(clk), .rst(rst), .to_rx(to_east_rx), .i_v(e_v), .i_x(e_out_c`x), .i_y(e_out_c`y), .i_d(e_out_c`d), .o_b(e_b));
credit_bp_rx #(.VC_W(VC_W), .D_W(D_W), .X_W(X_W), .Y_W(Y_W), .A_W(X_W+Y_W), .DEPTH(DEPTH))
    west_conn_rx(.clk(clk), .rst(rst), .from_tx(from_west_tx), .o_v(w_in_v), .o_x(w_in_x), .o_y(w_in_y), .o_d(w_in_data), .i_b(w_b));
credit_bp_tx #(.VC_W(VC_W), .D_W(D_W), .X_W(X_W), .Y_W(Y_W), .A_W(X_W+Y_W), .DEPTH(DEPTH))
    south_conn_tx(.clk(clk), .rst(rst), .to_rx(to_south_rx), .i_v(s_v), .i_x(s_out_c`x), .i_y(s_out_c`y), .i_d(s_out_c`d), .o_b(s_b));
credit_bp_rx #(.VC_W(VC_W), .D_W(D_W), .X_W(X_W), .Y_W(Y_W), .A_W(X_W+Y_W), .DEPTH(DEPTH))
    north_conn_rx(.clk(clk), .rst(rst), .from_tx(from_north_tx), .o_v(n_in_v), .o_x(n_in_x), .o_y(n_in_y), .o_d(n_in_data), .i_b(n_b));



    // instantiate dor_credit logic
dor_credit #(.VC_W(VC_W), .X_W(X_W), .Y_W(Y_W), .X(X), .Y(Y)) router_i (
    .n_x(n_in_x), .n_y(n_in_y), .n_v(n_in_v),
    .w_x(w_in_x), .w_y(w_in_y), .w_v(w_in_v),
    .i_x(i_x),    .i_y(i_y),    .i_v(i_v),  .i_vc(i_vc),
    .e_b(e_b), .s_b(s_b), .client_b(i_b),
    .e_v(e_v), .s_v(s_v), .o_v(o_v),
    .w_b(w_b), .n_b(n_b),
    .w2e(w2e), .w2s(w2s), .n2s(n2s),
    .i_ack(i_ack)
);

    // pipeline outputs (only really N->S)

wire [MSG_W-1:0] west_msg  = {w_in_x, w_in_y, w_in_data};
wire [MSG_W-1:0] north_msg = {n_in_x, n_in_y, n_in_data};
wire [MSG_W-1:0] pe_msg    = {i_x,    i_y,    i_data};
wire [MSG_W-1:0] east_bits, south_bits;

genvar b;
generate
    for (b = 0; b < MSG_W; b = b + 1) begin : g_xbar
        torus_xbar_1b xbar (
            .w2e(w2e), 
            .w2s(w2s), 
            .n2s(n2s),
            .ni (north_msg[b]),
            .wi (west_msg [b]),
            .pi (pe_msg   [b]),
            .so (south_bits[b]),
            .eo (east_bits [b])
        );
    end
endgenerate

assign {e_out_c`x, e_out_c`y, e_out_c`d} = east_bits;
assign {s_out_c`x, s_out_c`y, s_out_c`d} = south_bits;
assign {o_out_x, o_out_y, o_out_data} = south_bits;


    assign done = !(o_v | i_v | (|e_v) | (|w_in_v) | (|from_west_tx.vc_target) | (|s_v) | (|n_in_v) | (|from_north_tx.vc_target));
endmodule
