`timescale 1ns/1ps

// DOR routing but for BP
// Routing decision and backpressure based off the following rules:
// No backpressure signal along North to South -> NS priority
//      if there is a north input that wants to go south, it goes south
// If west wants to turn south, but north to south is used, then bp on west
// If PE wants to go south but N->S or W->S used, no ack
// If PE wants to go west but BP, no ack
// If West wants to go East but BP, propagate BP

module dor_bp #(
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

    input  logic e_b,        // backpressure signals
    input  logic client_b,
    input  logic s_b,

    output logic n_b,
    output logic w_b,

    output logic e_v,
    output logic s_v,
    output logic o_v,

    output logic n2s,
    output logic w2s,
    output logic w2e,
    output logic i_ack
);


// Your lab3 code here
logic w_pref_s;
logic i_pref_s;
logic s_busy;
logic e_busy;

always_comb begin
    w_pref_s = (w_x == X_W'(X));
    i_pref_s = (i_x == X_W'(X));

    e_v  = 1'b0;
    s_v  = 1'b0;
    o_v  = 1'b0;

    n2s  = 1'b0;
    w2s  = 1'b0;
    w2e  = 1'b0;

    i_ack = 1'b0;

    s_busy = 1'b0;
    e_busy = 1'b0;

    // input from North
    if (n_v) begin
        if (n_x == X_W'(X) && n_y == X_W'(Y)) begin
            o_v = 1'b1;
        end else begin
            s_v = 1'b1;
        end
        n2s = 1'b1;
        s_busy = 1'b1;
    end

    // input from West
    if (w_v) begin
        if(!s_busy) begin
            if(w_x == X_W'(X) && w_y == X_W'(Y)) begin
                o_v = 1'b1;
                w2s = 1'b1;
                s_busy = 1'b1;
            end else if(w_pref_s) begin
                s_v   = 1'b1;
                w2s   = 1'b1;
                s_busy= 1'b1;
            end else begin
                e_v   = 1'b1;
                w2e   = 1'b1;      
                e_busy= 1'b1;
            end
        end else begin
            e_v   = 1'b1;
            w2e   = 1'b1;
            e_busy= 1'b1;
        end
    end

    // input from PE
    if (i_v) begin
        if(!s_busy) begin
            if(i_x == X_W'(X) && i_y == X_W'(Y)) begin
                o_v = 1'b1;
                i_ack = 1'b1;
                s_busy = 1'b1;
            end else if(i_pref_s) begin
                s_v = 1'b1;
                i_ack = 1'b1;
                s_busy = 1'b1;
            end
        end 
        if(!e_busy) begin
            if(!i_pref_s) begin
                e_v   = 1'b1;
                i_ack = 1'b1;
                e_busy= 1'b1;
            end
        end
    end

end

endmodule

