`timescale 1ns/1ps

module client #(
  parameter SIGMA = 3,   // max burst length, (token bucket depth)
  parameter RATE  = 20,  // one packet every RATE CYCLES
	parameter VC_W  = 2,
	parameter X_W   = 2,
	parameter Y_W   = 2,
	parameter X     = 2,
	parameter Y     = 2,
	parameter D_W   = 28,
	parameter N_PACKETS = 128,
	parameter X_MAX = 1 << X_W,
	parameter Y_MAX = 1 << Y_W
) (
    input  logic clk,
    input  logic rst,
    input  logic i_ack,

    output logic i_v,
    output logic [VC_W-1:0] i_vc,
    output logic [X_W-1:0]  i_x,
    output logic [Y_W-1:0]  i_y,
    output logic [D_W-1:0]  i_data,
    output logic [VC_W-1:0] i_b,

    output logic done,

    input  logic o_v,
    input  logic [X_W-1:0] o_x,
    input  logic [Y_W-1:0] o_y,
    input  logic [D_W-1:0] o_data
);

`define vc		[VC_W+X_W+Y_W+D_W-1 : Y_W+D_W+X_W]
`define x		[X_W+Y_W+D_W-1 : Y_W+D_W]
`define y		[    Y_W+D_W-1 :     D_W]
`define d		[        D_W-1 :       0]

    logic [VC_W+X_W+Y_W+D_W-1:0] packets[X_MAX*Y_MAX*N_PACKETS];
    integer cycle_num = 0;
    integer __TEST_trace_fd;

    string trace_file_str;
    string packet_file_str;
    initial begin
        $sformat(packet_file_str, "%s_%0d_%0d", `PACKET_TRACE_PATH, X, Y);
        $readmemh(packet_file_str, packets);
        $sformat(trace_file_str, "%s_%0d_%0d", `TRACE_FILE, X, Y);
        __TEST_trace_fd = $fopen(trace_file_str, "w");
    end

    always @(posedge clk) begin
        if(rst) begin
            cycle_num <= 0;
        end else begin
            cycle_num <= cycle_num + 1;
        end
    end

    logic consume;
    logic token_avail;
    integer packet_num;
    logic waiting_for_ack;

    // Your Lab4 code here

    token_bucket #(.SIGMA(SIGMA), .RATE(RATE)) regulator (
        .clk(clk),
        .rst(rst),
        .consume(consume),
        .token_available(token_avail)
    );

    assign consume = (!waiting_for_ack || (waiting_for_ack && i_ack)) 
                        && packet_num < N_PACKETS && token_avail;

    logic i_v_r;
    logic [X_W-1:0] i_x_r;
    logic [Y_W-1:0] i_y_r;
    logic [D_W-1:0] i_d_r;
    logic [VC_W-1:0] i_vc_r;
    logic done_r;

    always @(posedge clk) begin
        if(rst) begin
            i_v_r <= 0;
            i_x_r <= 0;
            i_y_r <= 0;
            i_d_r <= 0;
            i_vc_r <= 0;
            waiting_for_ack <= 0;
            packet_num <= 0;
        end else begin
            // 2. write your sequntial code here
            if(consume) begin
                i_x_r <= packets[packet_num]`x;
                i_y_r <= packets[packet_num]`y;
                i_d_r <= packets[packet_num]`d;
                i_vc_r <= packets[packet_num]`vc;
                packet_num <= packet_num + 1;
                waiting_for_ack <= 1'b1;
                i_v_r <= 1'b1;
            end else if(i_ack) begin
                waiting_for_ack <= 0;
                i_v_r <= 0;
            end

            // do not delete this section
            if(consume) begin
                $fwrite(__TEST_trace_fd,"A,%0d,%x,%x,%x\n",cycle_num,packets[packet_num]`x,packets[packet_num]`y,packets[packet_num]`d);
            end

            if(i_ack) begin
                $fwrite(__TEST_trace_fd,"S,%0d,%x,%x,%x\n",cycle_num-1,i_x_r,i_y_r,i_d_r);
                if(packet_num == N_PACKETS) begin
                    done_r <= 1;
                end
            end

            if(o_v) begin
                $fwrite(__TEST_trace_fd,"R,%0d,%x,%x,%x\n",cycle_num,o_x,o_y,o_data);
            end
        end
    end

    assign i_v = i_v_r;
    assign i_x = i_x_r;
    assign i_y = i_y_r;
    assign i_vc = i_vc_r;
    assign i_data = i_d_r;
    assign i_b = '0;


    // Add following condition to your always block carefully to check if you have sent all packets into your lab4 logic
// if(i_ack) begin
//   if(packet_num == N_PACKETS) begin
//     done_r <= 1;
//   end
// end

    assign done   = done_r;
endmodule


