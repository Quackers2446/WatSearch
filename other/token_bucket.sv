`timescale 1ns/1ps

module token_bucket #(
    parameter SIGMA = 3,  // max burst length, (token bucket depth)
	parameter RATE  = 5  // one packet every RATE CYCLES
) (
    input  logic clk,
    input  logic rst,
    input  logic consume,

    output logic token_available
);

    reg [$clog2(SIGMA+1)-1:0] sigma = SIGMA[$clog2(SIGMA+1)-1:0];
    reg [$clog2(RATE+1)-1:0] rate = RATE[$clog2(RATE+1)-1:0];

    reg [$clog2(SIGMA+1)-1:0] number_tokens;
    reg [$clog2(RATE+1)-1:0] rate_counter;

    // your Lab4 code here

always @(posedge clk) begin
    if(rst) begin
        number_tokens <= SIGMA[$clog2(SIGMA)-1:0];
        rate_counter <= 0;
    end else begin
    // Write your code here
        if(rate_counter == rate-1) begin
            if (number_tokens < sigma && !consume) begin
                number_tokens <= number_tokens + 1;
            end
        end else begin
            if (consume && |number_tokens) begin
                number_tokens <= number_tokens - 1;
            end
        end

        if (rate_counter == rate-1) begin
            rate_counter <= 0;                         
        end else begin
            rate_counter <= rate_counter + 1;
        end

    end
end

assign token_available = |number_tokens;

    //ASSERTIONS, DO NOT REMOVE
    always @(posedge clk) begin
        if(!rst & (consume & !token_available)) begin
            $display("Client attempted to consume from empty token bucket");
            $fatal();
        end
    end
endmodule
