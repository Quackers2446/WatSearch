`timescale 1ns/1ps

//assuming we want similar interface to that of switch... otherwise we can
//revert back to previous implementation
module torus_switch #(
  parameter X_W	= 2,	// X address width
  parameter Y_W	= 2,	// Y address width
  parameter D_W	= 32,	// data width
  parameter X = 2,
  parameter Y = 2
) (
	input  logic clk,		// clock
	input  logic rst,		// reset

	input  logic n_in_v,	        // north in valid
	input  logic [X_W-1:0] n_in_x,	// north in x
	input  logic [Y_W-1:0] n_in_y,	// north in y
	input  logic [D_W-1:0] n_in_data,	// north in data

	input  logic w_in_v,	        // west in valid
	input  logic [X_W-1:0] w_in_x,	// west in x
	input  logic [Y_W-1:0] w_in_y,	// west in y
	input  logic [D_W-1:0] w_in_data,	// west in data

	input  logic i_v,	        // in valid
	input  logic [X_W-1:0] i_x,	    // in x
	input  logic [Y_W-1:0] i_y,	    // in y
	input  logic [D_W-1:0] i_data,	// in data

	output logic i_ack,		// input accepted this cycle
	output logic o_v,		// s_out is valid output message for this node

	output logic s_out_v,
	output logic [X_W-1:0] s_out_x,	// north in x
	output logic [Y_W-1:0] s_out_y,	// north in y
	output logic [D_W-1:0] s_out_data,	// north in data

	output  logic      e_out_v,
	output  [X_W-1:0] e_out_x,
	output  [Y_W-1:0] e_out_y,
	output  [D_W-1:0] e_out_data,

	output logic done
);

// your lab3 code here

`define v		[X_W+Y_W+D_W]
`define xv	[X_W+Y_W+D_W-1 : 0]
`define x		[X_W+Y_W+D_W-1 : Y_W+D_W]
`define y		[    Y_W+D_W-1 :     D_W]
`define d		[        D_W-1 :       0]
`define msg_w   (X_W+Y_W+D_W+1)

localparam int MSG_W = X_W + Y_W + D_W;
// pipeline inputs (except PE)

logic                 n_v_r, w_v_r;
logic [X_W-1:0]       n_x_r, w_x_r;
logic [Y_W-1:0]       n_y_r, w_y_r;
logic [D_W-1:0]       n_d_r, w_d_r;

logic s_out_v_r , e_out_v_r ;
logic [X_W-1:0] s_out_x_r , e_out_x_r ;
logic [Y_W-1:0] s_out_y_r , e_out_y_r ;
logic [D_W-1:0] s_out_d_r , e_out_d_r ;

// continuous ties to module outputs
assign s_out_v   = s_out_v_r;
assign e_out_v   = e_out_v_r;
assign s_out_x   = s_out_x_r;
assign s_out_y   = s_out_y_r;
assign s_out_data= s_out_d_r;
assign e_out_x   = e_out_x_r;
assign e_out_y   = e_out_y_r;
assign e_out_data= e_out_d_r;

always_ff @(posedge clk) begin
	if (rst) begin
		n_v_r <= 0;  w_v_r <= 0;
		n_x_r <= 0;	 w_x_r <= 0;
		n_y_r <= 0;  w_y_r <= 0;
		n_d_r <= 0;  w_d_r <= 0;
	end else begin
		n_v_r <= n_in_v;  w_v_r <= w_in_v;
		n_x_r <= n_in_x;  w_x_r <= w_in_x;
		n_y_r <= n_in_y;  w_y_r <= w_in_y;
		n_d_r <= n_in_data; w_d_r <= w_in_data;
	end
end

wire [MSG_W-1:0] n_msg = {n_x_r, n_y_r, n_d_r};
wire [MSG_W-1:0] w_msg = {w_x_r, w_y_r, w_d_r};
wire [MSG_W-1:0] i_msg = {i_x   , i_y   , i_data};

// instantiate DOR
logic e_v, s_v, o_v_r;
logic n2s, w2s, w2e;

dor #(.X_W(X_W), .Y_W(Y_W), .X(X), .Y(Y)) dor_i (
	.n_x(n_x_r), .n_y(n_y_r), .n_v(n_v_r),
	.w_x(w_x_r), .w_y(w_y_r), .w_v(w_v_r),
	.i_x(i_x),   .i_y(i_y),   .i_v(i_v),

	.e_v(e_v), .s_v(s_v), .o_v(o_v_r),
	.n2s(n2s), .w2s(w2s), .w2e(w2e),
	.i_ack(i_ack)
);

// Replaced lab1 multiplexer msg_w number of times. control signals come from
// DOR.
wire [MSG_W-1:0] south_bits;
wire [MSG_W-1:0] east_bits;

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
always_ff @(posedge clk) begin
    if (rst) begin
        s_out_v_r <= 1'b0;
        e_out_v_r <= 1'b0;
        o_v       <= 1'b0;

        s_out_x_r <= '0;  s_out_y_r <= '0;  s_out_d_r <= '0;
        e_out_x_r <= '0;  e_out_y_r <= '0;  e_out_d_r <= '0;
    end
    else begin
        s_out_v_r <= s_v;
        e_out_v_r <= e_v;
        o_v       <= o_v_r;

        {s_out_x_r, s_out_y_r, s_out_d_r} <= south_bits;
        {e_out_x_r, e_out_y_r, e_out_d_r} <= east_bits;
    end
end

  assign done = !(o_v_r | e_out_v_r | s_out_v_r | o_v | s_out_v | e_out_v | n_v_r | w_v_r | i_v | n_in_v | w_in_v);

endmodule
