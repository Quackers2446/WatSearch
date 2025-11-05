module shadow_reg #(
    parameter D_W = 32
) (
    input logic clk,
    input logic rst,

    input logic i_v,
    input logic [D_W-1:0] i_d,
    input logic o_b,

    output logic i_b,
    output logic o_v,
    output logic [D_W-1:0] o_d
);

    logic s_v;
    logic [D_W-1:0] s_d;
    always @(posedge clk) begin
      if(rst) begin
        o_v <= 1'b0;
        o_d <= {D_W{1'b0}};
        s_v <= 1'b0;
        s_d <= {D_W{1'b0}};
        i_b <= 1'b0;
      end else begin

        if(s_v) begin
          i_b <= 1'b1;
        end else begin
          i_b <= o_b;
        end

        // capture shadow data
        if(i_v && ~i_b && o_b) begin
          s_v <= i_v;
          s_d <= i_d;
        end else if(s_v && ~o_b) begin
          s_v <= 1'b0;
        end

        // drive output
        if(~o_b) begin
          if(s_v) begin
            o_v <= 1'b1;
            o_d <= s_d;
          end else if (i_v && ~i_b) begin
            o_v <= 1'b1;
            o_d <= i_d;
          end else begin
            o_v <= 1'b0;
          end
        end else begin
          //if(!i_v && !s_v) begin
          //  o_v <= 1'b0;
          //end
        end
      end
    end
endmodule
