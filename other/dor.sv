`timescale 1ns/1ps

///////////////////////////////////////////////////////////////////////////////
// DOR -- dimension ordered routing function
//
module dor #(
	parameter X_W	= 2,	// X address width
	parameter Y_W	= 2,	// Y address width
    parameter X = 0,
    parameter Y = 0
) (
    input  logic [X_W-1:0] n_x,
    input  logic [Y_W-1:0] n_y,
    input  logic n_v,

    input  logic [X_W-1:0] w_x,
    input  logic [Y_W-1:0] w_y,
    input  logic w_v,

    input  logic [X_W-1:0] i_x,
    input  logic [Y_W-1:0] i_y,
    input  logic i_v,

    output logic e_v,
    output logic s_v,
    output logic o_v,
    output logic n2s,
    output logic w2s,
    output logic w2e,
    output logic i_ack
);
// Lab3 code here

logic n_local , w_local , i_local;   
logic w_pref_s, i_pref_s;            
logic s_busy,   e_busy;        

assign n_local = (n_x == X_W'(X)) && (n_y == Y_W'(Y));
assign w_local = (w_x == X_W'(X)) && (w_y == Y_W'(Y));
assign i_local = (i_x == X_W'(X)) && (i_y == Y_W'(Y));

assign w_pref_s = (w_x == X_W'(X));
assign i_pref_s = (i_x == X_W'(X));

always_comb begin
    // defaults
    e_v = 0;  s_v = 0;  o_v = 0;
    n2s = 0;  w2s = 0;  w2e = 0;
    i_ack = 0;
    s_busy = 0;
    e_busy = 0;

    // NORTH input
    if (n_v) begin
        if (n_local)  o_v = 1;
        else          s_v = 1;

        n2s   = 1;
        s_busy = 1;
    end

    // WEST input 
    if (w_v) begin
        if (w_local && !s_busy) begin          
            o_v   = 1;
            w2s   = 1;
            s_busy = 1;
        end
        else if (w_pref_s && !s_busy) begin     
            s_v   = 1;
            w2s   = 1;
            s_busy = 1;
        end
        else begin                              
            e_v   = 1;
            w2e   = 1;
            e_busy = 1;
        end
    end

    // PE injection
    if (i_v) begin
        if (!s_busy && (i_local || i_pref_s)) begin
            if (i_local)  o_v = 1;   
            else          s_v = 1;

            i_ack = 1;
            s_busy = 1;
        end
        else if (!e_busy && !i_pref_s) begin
            e_v   = 1;
            i_ack = 1;
            e_busy = 1;
        end
    end
end

endmodule
