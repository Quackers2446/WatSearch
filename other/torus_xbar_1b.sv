`timescale 1ns/1ps

module torus_xbar_1b
(
	input logic w2e,
	input logic w2s,
	input logic n2s,
	input logic ni,
	input logic wi,
	input logic pi,
	output logic so,
	output logic eo
);

// Your Lab1 code here
assign so = n2s ? ni : w2s ? wi : pi;     
assign eo = w2e ? wi : pi;

endmodule
