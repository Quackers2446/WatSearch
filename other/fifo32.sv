`timescale 1ns/1ps
/*
 * File:    fifo32.sv
 * Brief:   FIFO primitive, 32-entry depth granularity
 *
 * Copyright:
 *  Copyright (C) 2019 Gurshaant Singh Malik, Nachiket Kapre
 *  Copyright (C) 2024 Nachiket Kapre
 *  Copyright (C) 2024 John Jekel
 * See the README.md file at the root of the repo for licensing info.
 *
 * Useful for abstracting a FIFO primitive of the target implementation technology
 *
 * Avaiable technologies (TECH):
 * - FIFO18E1
 * - FIFO18E2
 * - RTL
 * - TODO more options (LUTRAM, BRAM + fabric logic, ASIC SRAM based, etc.)
 * - TODO lutram based, super minimal lut usage
 *
 * Note that while two FIFO18s can't go into the same BRAM, if you make one of
 * your FIFOs a FIFO18 and the other an RTL, they can share the same BRAM
 * (provided the RTL infers a RAMB18 correctly, which it should)
 *
*/

/* ------------------------------------------------------------------------------------------------
 * Module Definition
 * --------------------------------------------------------------------------------------------- */

module fifo32 #(
    parameter int       DEPTH32     = 4,//Actual depth is DEPTH32 * 32 - 1
    parameter int       WIDTH       = 32,
    parameter int       RLATENCY    = 0//Read latency (0 means combinational, AKA FWFT)
) (
    //Clock and reset
    input   logic clk,
    input   logic rst,

    //Push interface, 1-cycle latency
    input   logic               i_push,
    output  logic               o_full,
    input   logic [WIDTH-1:0]   i_wdata,

    //Pop interface, 1-cycle latency
    input   logic               i_pop,
    output  logic               o_empty,
    output  logic [WIDTH-1:0]   o_rdata
);

localparam int DEPTH = DEPTH32 * 32;//Actual depth is this - 1

generate
    logic [WIDTH-1:0]           fifo_data [DEPTH-1:0];//Unpacked array to make it more likely to infer SRAM
    logic [$clog2(DEPTH)-1:0]   fifo_head, fifo_tail, next_fifo_head, next_fifo_tail;

    always_comb begin
        //The DEPTH is always a power of 2 so we can rely on wrapping
        next_fifo_head = fifo_head + ($clog2(DEPTH))'(1);
        next_fifo_tail = fifo_tail + ($clog2(DEPTH))'(1);

        //Worse timing if we do these combinatinationally
        //o_full  = next_fifo_head == fifo_tail;//Next push would make it indistinguishable from empty
        //o_empty = fifo_head == fifo_tail;
    end

    //Instead, put the comparisons behind flops :)
    always_ff @(posedge clk) begin
        if (rst) begin
            o_full  <= 1'b0;
            o_empty <= 1'b1;
        end else begin
            if (i_push && i_pop) begin
                o_full  <= (next_fifo_head + ($clog2(DEPTH))'(1)) == next_fifo_tail;
                o_empty <=  next_fifo_head                        == next_fifo_tail;
            end else if (i_push) begin
                o_full  <= (next_fifo_head + ($clog2(DEPTH))'(1)) ==      fifo_tail;
                o_empty <=  next_fifo_head                        ==      fifo_tail;
            end else if (i_pop) begin
                o_full  <=  next_fifo_head                        == next_fifo_tail;
                o_empty <=       fifo_head                        == next_fifo_tail;
            end
        end
    end

    always_ff @(posedge clk) begin
        if (rst) begin
            fifo_head   <= '0;
            fifo_tail   <= '0;
        end else begin
            if (i_push) begin
                fifo_head <= next_fifo_head;
            end

            if (i_pop) begin
                fifo_tail <= next_fifo_tail;
            end
        end
    end

    //Seperate always_ff to make it more likely to infer SRAM
    always_ff @(posedge clk) begin
        if (i_push) begin
            fifo_data[fifo_head] <= i_wdata;//Input demux (1-cycle latency)
        end
    end

    if (RLATENCY == 0) begin : gen_rlatency0
        assign o_rdata = fifo_data[fifo_tail];//Output mux (0-cycle latency)
    end : gen_rlatency0
    else begin : gen_rlatency1
        always_ff @(posedge clk) begin
            if (i_pop) begin
                o_rdata <= fifo_data[fifo_tail];//Output mux (1-cycle latency)
            end
        end
    end : gen_rlatency1
endgenerate

/* ------------------------------------------------------------------------------------------------
 * Assertions
 * --------------------------------------------------------------------------------------------- */

`ifdef SIMULATION

//Control signals should be known out of reset
assert property (@(posedge clk) disable iff (rst) !$isunknown(i_push));
assert property (@(posedge clk) disable iff (rst) !$isunknown(i_pop));
assert property (@(posedge clk) disable iff (rst) !$isunknown(o_empty));
assert property (@(posedge clk) disable iff (rst) !$isunknown(o_full));

//Fundamental FIFO integrity assertions
assert property (@(posedge clk) disable iff (rst) !(o_empty && i_pop));
assert property (@(posedge clk) disable iff (rst) !(o_full  && i_push));

//Qualified data shouldn't be unknown when valid
assert property (@(posedge clk) disable iff (rst) (i_push   |-> !$isunknown(i_wdata)));
assert property (@(posedge clk) disable iff (rst) (!o_empty |-> !$isunknown(o_rdata)));

`endif //SIMULATION

endmodule : fifo32
