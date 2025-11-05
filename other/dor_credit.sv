`timescale 1ns/1ps

// simple exact same thing as dor_bp but with
// multiple virtual channels, w_b acts as ack
// i_vc and w_v are source vc for i input and w input respectively

module dor_credit #(
  parameter VC_W  = 3,
  parameter X_W	= 2,	// X address width
  parameter Y_W	= 2,	// Y address width
  parameter D_W	= 32,
  parameter X = 0,
  parameter Y = 0
  ) (
    input  logic [X_W-1:0] n_x,
    input  logic [Y_W-1:0] n_y,
    input  logic [VC_W-1:0] n_v,

    input  logic [X_W-1:0] w_x,
    input  logic [Y_W-1:0] w_y,
    input  logic [VC_W-1:0]  w_v,

    input  logic [X_W-1:0] i_x,
    input  logic [Y_W-1:0] i_y,
    input  logic i_v,
    input  logic [VC_W-1:0] i_vc,

    input  logic [VC_W-1:0] e_b,        // backpressure signal
    input  logic [VC_W-1:0] client_b,
    input  logic [VC_W-1:0] s_b,

    output logic n_b,
    output logic [VC_W-1:0] e_v,         // east
    output logic w_b,

    output logic [VC_W-1:0] s_v,
    output logic o_v,

    output logic n2s,
    output logic w2s,
    output logic w2e,
    output logic i_ack
);

// Your code here

function automatic logic [$clog2(VC_W)-1:0]
    first_one (input logic [VC_W-1:0] vec);
    int k;
    begin
        first_one = '0;
        for (k = 0; k < VC_W; k++)
            if (vec[k]) begin
                first_one = k[$clog2(VC_W)-1:0];
                break;
            end
    end
endfunction

logic [$clog2(VC_W)-1:0] n_idx, w_idx, i_idx;
logic [VC_W-1:0] n_sel_oh, w_sel_oh, i_sel_oh;

logic n_local, w_local, i_local;
logic w_pref_s, i_pref_s;

logic s_busy, e_busy;

always_comb begin
  n_idx     = first_one(n_v);
  w_idx     = first_one(w_v);
  i_idx     = first_one(i_vc);

  n_sel_oh  = (|n_v) ? (1 << n_idx) : '0;
  w_sel_oh  = (|w_v) ? (1 << w_idx) : '0;
  i_sel_oh  = ( i_v) ? (1 << i_idx) : '0;

  n_local   = (n_x == X_W'(X)) && (n_y == Y_W'(Y));
  w_local   = (w_x == X_W'(X)) && (w_y == Y_W'(Y));
  i_local   = (i_x == X_W'(X)) && (i_y == Y_W'(Y));

  w_pref_s  = (w_x == X_W'(X));
  i_pref_s  = (i_x == X_W'(X));

  e_v = '0;  s_v = '0;  o_v = 1'b0;
  n_b = 1'b0;  w_b = 1'b0;
  n2s = 1'b0;  w2s = 1'b0;  w2e = 1'b0;
  i_ack = 1'b0;
  s_busy = 1'b0;
  e_busy = 1'b0;

  if (|n_v) begin
      if (n_local) begin
          if (!client_b[n_idx]) begin
              o_v = 1'b1;   n2s = 1'b1;   s_busy = 1'b1;
          end
          else n_b = 1'b1;
      end
      else begin
          if (!s_b[n_idx]) begin
              s_v = n_sel_oh;  n2s = 1'b1;  s_busy = 1'b1;
          end
          else n_b = 1'b1;
      end
  end

  if (|w_v) begin
      if (!s_busy) begin
          if (w_local) begin
              if (!client_b[w_idx]) begin
                  o_v = 1'b1;   w2s = 1'b1;   s_busy = 1'b1;
              end
              else w_b = 1'b1;
          end
          else if (w_pref_s) begin
              if (!s_b[w_idx]) begin
                  s_v = w_sel_oh;  w2s = 1'b1;  s_busy = 1'b1;
              end
              else w_b = 1'b1;
          end
          else begin   
              if (!e_b[w_idx]) begin
                  e_v = w_sel_oh;  w2e = 1'b1;  e_busy = 1'b1;
              end
              else w_b = 1'b1;
          end
      end
      else if (!e_busy) begin
          if (!w_pref_s && !e_b[w_idx]) begin
              e_v = w_sel_oh;  w2e = 1'b1;  e_busy = 1'b1;
          end
          else w_b = 1'b1;
      end
      else w_b = 1'b1;
  end

  if (i_v) begin
      if (!s_busy) begin
          if (i_local) begin
              if (!client_b[i_idx]) begin
                  o_v = 1'b1;   i_ack = 1'b1;   s_busy = 1'b1;
              end
          end
          else if (i_pref_s && !client_b[i_idx] && !s_b[i_idx]) begin
              s_v = i_sel_oh;   i_ack = 1'b1;   s_busy = 1'b1;
          end
      end
      if (!i_pref_s && !e_busy && !e_b[i_idx]) begin
          e_v = i_sel_oh;   i_ack = 1'b1;   e_busy = 1'b1;
      end
  end
end

endmodule
