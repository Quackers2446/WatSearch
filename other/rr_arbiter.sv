`timescale 1ns/1ps

/* ------------------------------------------------------------------------------------------------
 * Module Definition
 * --------------------------------------------------------------------------------------------- */

module allocator #(
    parameter REQUEST_LINES = 3
) (
    input logic clk,
    input logic en,                      // should a request be processed
    input logic [REQUEST_LINES-1:0]     req,  // 1 to make requests
    output logic [REQUEST_LINES-1:0]    grant // asserts 1 to grant
);

reg [2*REQUEST_LINES-1:0] grant_base;

generate

if(WIDTH == 1) begin
    assign grant = req;
end
else if(WIDTH == 2) begin
    reg [1:0] next;

    always @(posedge clk) begin
        if(^req) begin
            grant <= req;
            next <= ~req;
        end
        else if(|req) begin
            grant <= next;
            next <= {next[0],next[1]};
        end
        else begin
            grant <= 0;
        end
    end
end
else begin
    //generate round robin selection logic
    logic [REQUEST_LINES-1:0] next_grant;
    always @(posedge clk) begin
        if(rst) begin
            grant <= 0;
            grant_base <= 1;
        end
        else begin
            grant <= next_grant;
            if(!en) begin
                grant_base <= grant_base;
            end
            else if(|next_grant) begin
                grant_base <= {REQUEST_LINES'(0), next_grant[REQUEST_LINES-2:0], next_grant[REQUEST_LINES-1]};
            end
            else begin
                grant_base <= 1;
            end
        end
    end

    // baesd off altera fair arbiter
    // unset first bit in request greater or equal to grant_base
    // and now request & ~(modified_request) will only have the desired bit
    // (bit that was unset in modified_request)
    // extract the unset bit
    logic [2*REQUEST_LINES-1:0] double_req = {req,req};
    logic [2*REQUEST_LINES-1:0] double_grant = double_req & ~(double_req-grant_base);
    assign next_grant = double_grant[REQUEST_LINES-1:0] | double_grant[2*REQUEST_LINES-1:REQUEST_LINES];
end

endgenerate

endmodule : credit_bp_rx
