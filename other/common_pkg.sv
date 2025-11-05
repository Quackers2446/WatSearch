`timescale 1ns/1ps

/*
 * File:    common_pkg.sv
 * Brief:   Common package for NoC implementation and other purposes
 *
 * Copyright:
 *  Copyright (C) 2019 Gurshaant Singh Malik, Nachiket Kapre
 *  Copyright (C) 2024 Nachiket Kapre
 *  Copyright (C) 2024 John Jekel
 * See the README.md file at the root of the repo for licensing info.
 *
*/

/* ------------------------------------------------------------------------------------------------
 * Package Definition
 * --------------------------------------------------------------------------------------------- */

package common_pkg;
//verilator lint_save
//verilator lint_off UNUSEDPARAM

/* ------------------------------------------------------------------------------------------------
 * Parameters
 * --------------------------------------------------------------------------------------------- */

parameter int DEFAULT_X_W       = 2;
parameter int DEFAULT_Y_W       = 2;
parameter int DEFAULT_YMAX      = 1 << DEFAULT_X_W;
parameter int DEFAULT_XMAX      = 1 << DEFAULT_Y_W;
parameter int DEFAULT_D_W       = 32;//Data width

//Default widths for noc_if, other modules if not overridden
parameter int DEFAULT_VC_W      = 3;                  //Number of virtual channels (one bit per VC, not $clog2)
parameter int DEFAULT_A_W       = DEFAULT_X_W + DEFAULT_Y_W;

parameter int DEFAULT_VC_FIFO_DEPTH = 32;//Number of fifo entries + 1; should be multiple of 32

//verilator lint_restore
endpackage : common_pkg
