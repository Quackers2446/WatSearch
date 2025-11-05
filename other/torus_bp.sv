module torus_bp #(
  parameter SIGMA = 3,   // max burst length, (token bucket depth)
  parameter RATE  = 20,  // one packet every RATE CYCLES
  parameter VC_W  = 1,
  parameter X_W   = 2,
  parameter Y_W   = 2,
  parameter D_W   = 256,
  parameter N_PACKETS = 128,
  // NoC Size
  parameter X_MAX		  = 1<<X_W,
  parameter Y_MAX		  = 1<<Y_W
) (
  input  logic clk,
  input  logic rst,
  output logic out_v,
  output logic [D_W-1:0] out,
  output done
);

    `define Msg_W (X_W+Y_W+D_W+1)
    `define Msg [`Msg_W-1:0]

    `define x_addr [X_W+Y_W+D_W-1:Y_W+D_W]
    `define y_addr [Y_W+D_W-1:D_W]
    `define vcvec  [VC_W-1:0]
    `define data   [D_W-1:0]
    `define valid  [X_W+Y_W+D_W]

    `define x1 ((x+X_MAX-1)%X_MAX)
    `define xp1 ((x+1)%X_MAX)
    `define y1 ((y+Y_MAX-1)%Y_MAX)
    `define yp1 ((y+1)%Y_MAX)

    // XY + PE connections
    logic `Msg i [X_MAX][Y_MAX];
    logic `Msg e [X_MAX][Y_MAX];
    logic `Msg s [X_MAX][Y_MAX];
    logic `Msg w [X_MAX][Y_MAX];
    logic `Msg n [X_MAX][Y_MAX];

    // tx outputs
    logic `Msg e_tx [X_MAX][Y_MAX];
    logic `Msg s_tx [X_MAX][Y_MAX];

    // back pressures
    logic e_b [X_MAX][Y_MAX];
    logic w_b [X_MAX][Y_MAX];
    logic s_b [X_MAX][Y_MAX];
    logic n_b [X_MAX][Y_MAX];
    logic [VC_W-1:0] client_b [X_MAX][Y_MAX];
    logic w_b_tx [X_MAX][Y_MAX];
    logic n_b_tx [X_MAX][Y_MAX];

    // PE interface
    logic o_v [X_MAX][Y_MAX];
    logic i_ack [X_MAX][Y_MAX];

    // i_vc
    (* keep="soft" *)
    logic [VC_W-1:0] i_vc [X_MAX][Y_MAX];

    // done signals
    logic done_pe [X_MAX][Y_MAX];
    logic done_switch [X_MAX][Y_MAX];

    genvar x, y, j;
    generate 
      for (y = 0; y < Y_MAX; y = y + 1) begin : ys
        for (x = 0; x < X_MAX; x = x + 1) begin : xs
          // your switch and client instantiations go here.
          localparam logic [X_W-1:0] X_ID = x;
          localparam logic [Y_W-1:0] Y_ID = y;

          assign n[x][y] = s[x][`y1];
          assign w[x][y] = e[`x1][y];
          
          // assign n_b[x][y] = s_b[x][(y == 0) ? Y_MAX-1 : y-1];
          // assign w_b[x][y] = e_b[(x == 0) ? X_MAX-1 : x-1][y];  

          assign s_b[x][y] = n_b[x][`yp1];
          assign e_b[x][y] = w_b[`xp1][y];

          client #(
            .SIGMA     (SIGMA),
            .RATE      (RATE),
            .VC_W      (VC_W),
            .X_W       (X_W),
            .Y_W       (Y_W),
            .D_W       (D_W),
            .X         (X_ID),
            .Y         (Y_ID),
            .N_PACKETS (N_PACKETS),
            .X_MAX     (X_MAX),
            .Y_MAX     (Y_MAX)
          ) u_pe (
            .clk   (clk),
            .rst   (rst),

            .i_v     (i[x][y]`valid),
            .i_vc    (i_vc[x][y]),
            .i_x     (i[x][y]`x_addr),
            .i_y     (i[x][y]`y_addr),
            .i_data  (i[x][y]`data),
            .i_b     (client_b[x][y]),
            .i_ack   (i_ack[x][y]),

            .o_v     (o_v[x][y]),
            .o_x     (s[x][y]`x_addr),
            .o_y     (s[x][y]`y_addr),
            .o_data  (s[x][y]`data),

            .done    (done_pe[x][y])
          );

          torus_switch_bp #(
            .X_W (X_W),
            .Y_W (Y_W),
            .D_W (D_W),
            .VC_W(VC_W),            
            .X   (X_ID),             
            .Y   (Y_ID),             
            .IN_PIPELINE_STAGES(0)
          ) u_switch (
            .clk     (clk),
            .rst     (rst),

            .n_in_v     (n[x][y]`valid),
            .n_in_x     (n[x][y]`x_addr),
            .n_in_y     (n[x][y]`y_addr),
            .n_in_data  (n[x][y]`data),

            .w_in_v     (w[x][y]`valid),
            .w_in_x     (w[x][y]`x_addr),
            .w_in_y     (w[x][y]`y_addr),
            .w_in_data  (w[x][y]`data),

            .i_v        (i[x][y]`valid),
            .i_x        (i[x][y]`x_addr),
            .i_y        (i[x][y]`y_addr),
            .i_data     (i[x][y]`data),
            .i_ack      (i_ack[x][y]),

            .e_b        (e_b[x][y]),
            .s_b        (s_b[x][y]),
            .client_b   (client_b[x][y]),

            .w_b        (w_b[x][y]),
            .n_b        (n_b[x][y]),          

            .o_v        (o_v[x][y]),

            .s_out_v    (s[x][y]`valid),
            .s_out_x    (s[x][y]`x_addr),
            .s_out_y    (s[x][y]`y_addr),
            .s_out_data (s[x][y]`data),

            .e_out_v    (e[x][y]`valid),
            .e_out_x    (e[x][y]`x_addr),
            .e_out_y    (e[x][y]`y_addr),
            .e_out_data (e[x][y]`data),

            .done       (done_switch[x][y])
          );
        
        end
      end 
    endgenerate

    assign out_v = o_v[0][0];
    assign out = s[0][0][D_W-1:0];

    logic done_all_pe;
    logic done_all_switch;
    integer xx, yy;
    // reduction tree
    always_comb begin
        done_all_pe = 1'b1;
        done_all_switch = 1'b1;
        for (xx = 0; xx < X_MAX; xx = xx + 1) begin : xred
            for (yy = 0; yy < Y_MAX; yy = yy + 1) begin : xred
                done_all_pe &= done_pe[xx][yy];
                done_all_switch &= done_switch[xx][yy];
            end
        end
    end

    assign done = done_all_pe & done_all_switch;
endmodule


