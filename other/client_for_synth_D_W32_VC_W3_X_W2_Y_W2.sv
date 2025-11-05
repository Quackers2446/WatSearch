//IGNORE PARAMETERS, UNUSED

module client #(parameter SIGMA = 3, parameter RATE = 20, parameter VC_W = 3, parameter X_W = 2, parameter Y_W = 2, parameter X= 2,  parameter Y= 2, parameter D_W = 32, parameter N_PACKETS = 128, parameter X_MAX = 1 << X_W, parameter Y_MAX = 1 << Y_W) (clk, rst, i_ack, i_v, i_vc, i_x, i_y, i_data, i_b, done, o_v, o_x, o_y, o_data);
  wire [2:0] _00_;
  wire [1:0] _01_;
  wire [31:0] _02_;
  wire [1:0] _03_;
  wire [31:0] _04_;
  wire [31:0] _05_;
  wire _06_;
  wire _07_;
  wire _08_;
  wire [1:0] _09_;
  input clk;
  wire clk;
  wire consume;
  output done;
  wire done;
  reg done_r;
  input i_ack;
  wire i_ack;
  output [2:0] i_b;
  wire [2:0] i_b;
  reg [31:0] i_d_r;
  output [31:0] i_data;
  wire [31:0] i_data;
  output i_v;
  wire i_v;
  wire i_v_r;
  output [2:0] i_vc;
  wire [2:0] i_vc;
  reg [2:0] i_vc_r;
  output [1:0] i_x;
  wire [1:0] i_x;
  reg [1:0] i_x_r;
  output [1:0] i_y;
  wire [1:0] i_y;
  reg [1:0] i_y_r;
  input [31:0] o_data;
  wire [31:0] o_data;
  input o_v;
  wire o_v;
  input [1:0] o_x;
  wire [1:0] o_x;
  input [1:0] o_y;
  wire [1:0] o_y;
  wire packet_num;
  input rst;
  wire rst;
  wire token_avail;
  reg waiting_for_ack;
  assign _00_ = { consume, consume, consume } + { o_data[0], o_data[0], o_data[0] };
  assign _01_ = i_ack + o_v;
  assign _02_ = { 30'h00000000, _09_ } + 32'd2;
  assign _03_ = o_y + consume;
  assign _04_ = { 30'h00000000, _03_ } + 32'd2;
  assign consume = token_avail & _07_;
  assign _05_ = o_data & { o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v, o_v };
  always @(posedge clk)
    if (rst) i_d_r <= 32'd0;
    else if (_07_) i_d_r <= _05_;
  always @(posedge clk)
    if (rst) done_r <= 1'h0;
    else if (_07_) done_r <= _08_;
  always @(posedge clk)
    if (rst) waiting_for_ack <= 1'h0;
    else if (_07_) waiting_for_ack <= consume;
  always @(posedge clk)
    if (rst) i_vc_r <= 3'h0;
    else if (_07_) i_vc_r <= _00_;
  always @(posedge clk)
    if (rst) i_x_r <= 2'h0;
    else if (_07_) i_x_r <= _02_[1:0];
  always @(posedge clk)
    if (rst) i_y_r <= 2'h0;
    else if (_07_) i_y_r <= _04_[1:0];
  assign _06_ = ! waiting_for_ack;
  assign _07_ = _06_ | i_ack;
  assign _08_ = o_v | i_ack;
  assign _09_ = o_x ^ _01_;
  token_bucket #(
    .RATE(32'sd20),
    .SIGMA(32'sd3)
  ) regulator (
    .clk(clk),
    .consume(consume),
    .rst(rst),
    .token_available(token_avail)
  );
  assign done = done_r;
  assign i_b = { 2'h0, waiting_for_ack };
  assign i_data = i_d_r;
  assign i_v = waiting_for_ack;
  assign i_v_r = waiting_for_ack;
  assign i_vc = i_vc_r;
  assign i_x = i_x_r;
  assign i_y = i_y_r;
  assign packet_num = 1'h0;
endmodule
