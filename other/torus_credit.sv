module torus_credit #(
    parameter SIGMA = 3,   // max burst length, (token bucket depth)
	parameter RATE  = 20,  // one packet every RATE CYCLES
	parameter VC_W  = 3,
	parameter X_W   = 2,
	parameter Y_W   = 2,
	parameter D_W   = 32,
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
    `define data   [D_W-1:0]
    `define valid  [X_W+Y_W+D_W]
    `define x1 ((x+X_MAX-1)%X_MAX)
    `define xp1 ((x+1)%X_MAX)
    `define y1 ((y+Y_MAX-1)%Y_MAX)
    `define yp1 ((y+1)%Y_MAX)

    // XY + PE connections
    logic `Msg i [X_MAX][Y_MAX];
    logic `Msg s [X_MAX][Y_MAX];
    logic `Msg o_out [X_MAX][Y_MAX];
    logic `Msg n [X_MAX][Y_MAX];

    // PE interface
    logic o_v [X_MAX][Y_MAX];
    logic i_ack [X_MAX][Y_MAX];
    logic [VC_W-1:0] client_b [X_MAX][Y_MAX];

    logic _nc;

    // i_vc
    (* keep="soft" *)
    logic [VC_W-1:0] i_vc [X_MAX][Y_MAX];

    // done signals
    logic done_pe [X_MAX][Y_MAX];
    logic done_switch [X_MAX][Y_MAX];

    genvar x, y, j;
    // generate for (y = 0; y < Y_MAX; y = y + 1) begin : yss
    //   for (x = 0; x < X_MAX; x = x + 1) begin : xss
    //     noc_if #(.D_W(D_W), .X_W(X_W), .Y_W(Y_W), .VC_W(VC_W))
    //     conn_if (.clk(clk), .rst(rst));

    //     noc_if #(.D_W(D_W), .X_W(X_W), .Y_W(Y_W), .VC_W(VC_W))
    //     conn_if_ns (.clk(clk), .rst(rst));
    //   end
    // end endgenerate

    generate for (y = 0; y < Y_MAX; y = y + 1) begin : ys
        for (x = 0; x < X_MAX; x = x + 1) begin : xs
          // your switch and client code here
          localparam int X_ID = x;
          localparam int Y_ID = y;
          
          noc_if #(.D_W(D_W), .X_W(X_W), .Y_W(Y_W), .VC_W(VC_W))
          conn_if_e (.clk(clk), .rst(rst));

          noc_if #(.D_W(D_W), .X_W(X_W), .Y_W(Y_W), .VC_W(VC_W))
          conn_if_w (.clk(clk), .rst(rst));

          noc_if #(.D_W(D_W), .X_W(X_W), .Y_W(Y_W), .VC_W(VC_W))
          conn_if_n (.clk(clk), .rst(rst));

          noc_if #(.D_W(D_W), .X_W(X_W), .Y_W(Y_W), .VC_W(VC_W))
          conn_if_s (.clk(clk), .rst(rst));

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

            .i_v    (i[x][y]`valid),
            .i_vc   (i_vc[x][y]),
            .i_x    (i[x][y]`x_addr),
            .i_y    (i[x][y]`y_addr),
            .i_data (i[x][y]`data),
            .i_b    (client_b[x][y]),
            .i_ack  (i_ack[x][y]),

            .o_v    (o_v[x][y]),
            .o_x    (o_out[x][y]`x_addr),
            .o_y    (o_out[x][y]`y_addr),
            .o_data (o_out[x][y]`data),

            .done   (done_pe[x][y])
          );

          torus_switch_credit #(
            .VC_W   (VC_W),
            .X_W    (X_W),
            .Y_W    (Y_W),
            .D_W    (D_W),
            .X_MAX  (X_MAX),
            .Y_MAX  (Y_MAX),
            .X      (X_ID),
            .Y      (Y_ID)
          ) u_router (
            .clk (clk),
            .rst (rst),

            .i_v      (i[x][y]`valid),
            .i_x      (i[x][y]`x_addr),
            .i_y      (i[x][y]`y_addr),
            .i_data   (i[x][y]`data),
            .i_vc     (i_vc[x][y]),
            .i_b      (client_b[x][y]),
            .i_ack    (i_ack[x][y]),

            .o_v        (o_v[x][y]),
            .o_out_x    (o_out[x][y]`x_addr),
            .o_out_y    (o_out[x][y]`y_addr),
            .o_out_data (o_out[x][y]`data),

            .to_east_rx      (conn_if_e),
            .from_west_tx    (conn_if_w),

            .to_south_rx     (conn_if_s),
            .from_north_tx   (conn_if_n),

            .done (done_switch[x][y])
          );

            for (j = 0; j < VC_W; j = j + 1) begin : conns_vc_info
              // your EW and NS low swing instances here
              low_swing_tx tx_e_vc (
                .i( conn_if_e.vc_target[j] ),
                .c( ys[y].xs[`xp1].conn_if_w.vc_target[j] )
              );

              low_swing_rx rx_w_vc (
                .i( ys[y].xs[`x1].conn_if_e.vc_target[j] ),
                .o( conn_if_w.vc_target[j] )
              );

              low_swing_tx tx_s_vc (
                .i( conn_if_s.vc_target[j] ),
                .c( ys[`yp1].xs[x].conn_if_n.vc_target[j] )
              );

              low_swing_rx rx_n_vc (
                .i( ys[`y1].xs[x].conn_if_s.vc_target[j] ),
                .o( conn_if_n.vc_target[j] )
              );
            end

            for (j = 0; j < D_W; j = j + 1) begin : conns_data
              // your EW and NS low swing instances here
              low_swing_tx tx_e_d (
                .i( conn_if_e.packet.payload.data[j] ),
                .c( ys[y].xs[`xp1].conn_if_w.packet.payload.data[j] )
              );

              low_swing_rx rx_w_d (
                .i( ys[y].xs[`x1].conn_if_e.packet.payload.data[j] ),
                .o( conn_if_w.packet.payload.data[j] )
              );

              low_swing_tx tx_s_d (
                .i( conn_if_s.packet.payload.data[j] ),
                .c( ys[`yp1].xs[x].conn_if_n.packet.payload.data[j] )
              );

              low_swing_rx rx_n_d (
                .i( ys[`y1].xs[x].conn_if_s.packet.payload.data[j] ),
                .o( conn_if_n.packet.payload.data[j] )
              );
            end

            for (j = 0; j < X_W+Y_W; j = j + 1) begin : conns_addr
              // your EW and NS low swing instances here
              low_swing_tx tx_e_a (
                .i( conn_if_e.packet.routeinfo.addr[j] ),
                .c( ys[y].xs[`xp1].conn_if_w.packet.routeinfo.addr[j] )
              );

              low_swing_rx rx_w_a (
                .i( ys[y].xs[`x1].conn_if_e.packet.routeinfo.addr[j] ),
                .o( conn_if_w.packet.routeinfo.addr[j] )
              );

              low_swing_tx tx_s_a (
                .i( conn_if_s.packet.routeinfo.addr[j] ),
                .c( ys[`yp1].xs[x].conn_if_n.packet.routeinfo.addr[j] )
              );

              low_swing_rx rx_n_a (
                .i( ys[`y1].xs[x].conn_if_s.packet.routeinfo.addr[j] ),
                .o( conn_if_n.packet.routeinfo.addr[j] )
              );
            end
        end
    end endgenerate

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

