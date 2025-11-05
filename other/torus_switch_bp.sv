`timescale 1ns/1ps

//pure hoplite_bp with no fifo from W->S
module torus_switch_bp #(
	parameter X_W	= 2,	            // X address width
	parameter Y_W	= 2,	            // Y address width
	parameter D_W	= 32,	    // data width parameter X_MAX	= 1<<X_W,
	parameter VC_W= 1,	    // not really needed, but have to keep intgerface consistent
	parameter X	= 2,	                // X address of this node
  parameter Y	= 2,		            // Y address of this node
  parameter IN_PIPELINE_STAGES = 0
) (
	input  logic clk,		            // clock
	input  logic rst,		            // reset

	input  logic n_in_v,	                // north in valid
	input  logic [X_W-1:0] n_in_x,	    // north in x
	input  logic [Y_W-1:0] n_in_y,	    // north in y
	input  logic [D_W-1:0] n_in_data,	// north in data

	input  logic w_in_v,	                // west in valid
	input  logic [X_W-1:0] w_in_x,	    // west in x
	input  logic [Y_W-1:0] w_in_y,	    // west in y
	input  logic [D_W-1:0] w_in_data,	// west in data

	input  logic i_v,	                // in valid
	input  logic [X_W-1:0] i_x,	        // in x
	input  logic [Y_W-1:0] i_y,	        // in y
	input  logic [D_W-1:0] i_data,	    // in data

  input  logic e_b,                    // east backpressure in
  input  logic [VC_W-1:0] client_b,               // client backpressure in
  input  logic s_b,                    // south backpressure in
  output logic w_b,                    // generated west backpressure
  output logic n_b,                    // generateed north backpressure

	output logic i_ack,		            // input accepted this cycle
	output logic o_v,		            // s_out is valid output message for this node

  output logic s_out_v,
	output logic [X_W-1:0] s_out_x,	    // north in x
	output logic [Y_W-1:0] s_out_y,	    // north in y
	output logic [D_W-1:0] s_out_data,	// north in data

	output logic e_out_v,
	output logic [X_W-1:0] e_out_x,
	output logic [Y_W-1:0] e_out_y,
	output logic [D_W-1:0] e_out_data,

  output logic done
);

// Your lab3 code here

`define v		[X_W+Y_W+D_W]
`define xv	[X_W+Y_W+D_W-1 : 0]
`define x		[X_W+Y_W+D_W-1 : Y_W+D_W]
`define y		[    Y_W+D_W-1 :     D_W]
`define d		[        D_W-1 :       0]
`define Msg_W   (X_W+Y_W+D_W+1)

localparam int MSG_W = X_W + Y_W + D_W;

logic [MSG_W-1:0] n_d_c, w_d_c;
logic n_v_c, w_v_c;
logic n_bp_core, w_bp_core, s_bp_core, e_bp_core;

// instantiate shadow registers for W input only
shadow_reg #(.D_W(MSG_W)) shad_W (
	.clk(clk), .rst(rst),
	.i_v (w_in_v),
	.i_d ({w_in_x, w_in_y, w_in_data}),
	.o_b (w_bp_core),
	.i_b (w_b),
	.o_v (w_v_c),
	.o_d (w_d_c)
);

shadow_reg #(.D_W(MSG_W)) shad_N (
	.clk(clk), .rst(rst),
	.i_v (n_in_v),
	.i_d ({n_in_x, n_in_y, n_in_data}),
	.o_b (n_bp_core),     
	.i_b (n_b),       
	.o_v (n_v_c),
	.o_d (n_d_c)
);

logic [X_W-1:0] n_x_c, w_x_c;
logic [Y_W-1:0] n_y_c, w_y_c;
logic [D_W-1:0] n_payload, w_payload;

assign {n_x_c, n_y_c, n_payload} = n_d_c;
assign {w_x_c, w_y_c, w_payload} = w_d_c;

// instantiate dor_bp
logic e_v_core, s_v_core, o_v_r;
logic n2s, w2s, w2e;

dor_bp #(.X_W(X_W), .Y_W(Y_W), .X(X), .Y(Y)) dor_bp_i (
        .n_x(n_x_c), .n_y(n_y_c), .n_v(n_v_c),
        .w_x(w_x_c), .w_y(w_y_c), .w_v(w_v_c),
        .i_x(i_x),   .i_y(i_y),   .i_v(i_v),
        .e_b(e_b), .s_b(s_b), .client_b(|client_b),
        .n_b(n_bp_core), .w_b(w_bp_core),
        .e_v(e_out_v), .s_v(s_out_v), .o_v(o_v),
        .n2s(n2s), .w2s(w2s), .w2e(w2e),
        .i_ack(i_ack)
    );


// Replace lab1 multiplexer msg_w number of times. control signals come from
// DOR.
wire [MSG_W-1:0] n_msg = n_d_c;
wire [MSG_W-1:0] w_msg = w_d_c;
wire [MSG_W-1:0] i_msg = {i_x, i_y, i_data};
wire [MSG_W-1:0] south_bits, east_bits;

genvar b;
generate
	for (b = 0; b < MSG_W; b = b + 1) begin : gen_xbar
		torus_xbar_1b xbar (
			.w2e (w2e),
			.w2s (w2s),
			.n2s (n2s),
			.ni   (n_msg[b]),
			.wi   (w_msg[b]),
			.pi   (i_msg[b]),
			.so   (south_bits[b]),
			.eo   (east_bits[b])
		);
	end
endgenerate

// pipeline outputs

always_comb begin
	{e_out_x, e_out_y, e_out_data} = east_bits;
	{s_out_x, s_out_y, s_out_data} = south_bits;
end


assign done = !(o_v | s_out_v | e_out_v | n_in_v | w_in_v | i_v | w_v_c | n_v_c);

endmodule

