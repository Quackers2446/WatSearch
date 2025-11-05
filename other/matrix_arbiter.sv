`timescale 1ns/1ps

/* ------------------------------------------------------------------------------------------------
 * Module Definition
 * --------------------------------------------------------------------------------------------- */

module matrix_arbiter #(
    parameter REQUEST_LINES = 4
) (
    input logic rst,
    input logic clk,
    input logic en,                           // should a request be processed
    input logic [REQUEST_LINES-1:0]     req,  // 1 to make requests
    output logic [REQUEST_LINES-1:0]    grant // asserts 1 to grant
);


logic [REQUEST_LINES-1:0] prio [REQUEST_LINES-1:0];

logic [REQUEST_LINES-1:0] winner;

always_comb begin
    for (int i = 0; i < REQUEST_LINES; i++) begin
        logic win = req[i];
        for (int j = 0; j < REQUEST_LINES; j++) begin
            if (i != j)
                win &= (~req[j]) | prio[i][j];
        end
        winner[i] = win;
    end
end

always_ff @(posedge clk or posedge rst) begin
    if (rst) begin
        grant <= '0;
    end
    else if (en) begin
        grant <= winner;         
    end
end

always_ff @(posedge clk or posedge rst) begin
    if (rst) begin
        for (int r = 0; r < REQUEST_LINES; r++) begin
            for (int c = 0; c < REQUEST_LINES; c++) begin
                prio[r][c] <= (r > c);   
            end
        end
    end
    else if (en) begin
        int g = -1;
        for (int i = 0; i < REQUEST_LINES; i++)
            if (winner[i]) g = i;

        if (g != -1) begin
            for (int k = 0; k < REQUEST_LINES; k++) begin
                prio[g][k] <= 1'b0;
                prio[k][g] <= 1'b1;
            end
            prio[g][g] <= 1'b0;   
        end
    end
end

endmodule : matrix_arbiter
