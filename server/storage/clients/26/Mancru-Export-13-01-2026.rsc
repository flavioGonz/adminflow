# 2026-01-13 12:51:42 by RouterOS 7.12.1
# software id = 13ER-6PI0
#
# model = RB1100Dx4
# serial number = D8550FC5A75C
/interface bridge
add igmp-snooping=yes multicast-querier=yes name=bridge
/interface ethernet
set [ find default-name=ether6 ] name=ether6_CORE16
set [ find default-name=ether13 ] name=ether13_LTErouter
/interface l2tp-client
add connect-to=vpn.seguridadtotal.com.uy ipsec-secret=seguridad*2011 name=\
    l2tp-out1 password=mancru*2011 use-ipsec=yes user=mancru
/interface wireguard
add disabled=yes listen-port=13231 mtu=1420 name=wireguard1 private-key=\
    "AJpGJB1UZkXor3VMmzrd4BC5FdIOzqhl6Ln2RHbBwkE="
/interface vlan
add comment="CCTV - 192.168.10.1/24" interface=bridge name=vlan10_CCTV \
    vlan-id=10
add comment="Datos - 192.168.20.1/24" interface=bridge name=vlan20_Datos \
    vlan-id=20
add comment="Telefonia & Acceso - 192.168.30.1/24" interface=bridge name=\
    vlan30_telefonia_Acceso vlan-id=30
add comment="Invitados - 192.168.40.1/24" interface=bridge name=\
    vlan40_Invitados vlan-id=40
/interface pppoe-client
add add-default-route=yes disabled=no interface=ether1 name=pppoe-out1 \
    password=antel user=antel@adsl.com
/disk
set sata1 type=hardware
add parent=sata1 partition-number=1 partition-offset=512 partition-size=\
    "64 017 353 728" type=partition
/interface lte apn
set [ find default=yes ] ip-type=ipv4 use-network-apn=no
/interface wireless security-profiles
set [ find default=yes ] supplicant-identity=MikroTik
/ip dhcp-server option
add code=43 name=unifi-controller value=0x0104C0A81459
/ip pool
add name=dhcp_pool0 ranges=192.168.10.2-192.168.10.254
add name=dhcp_Gestion ranges=10.0.101.2-10.0.101.254
add name=dhcp_pool2 ranges=192.168.20.2-192.168.20.254
add name=dhcp_pool3 ranges=192.168.30.2-192.168.30.254
add name=dhcp_pool4 ranges=10.0.10.2-10.0.10.254
add name=dhcp_CCTV ranges="192.168.10.2-192.168.10.10,192.168.10.20-192.168.10\
    .150,192.168.10.160-192.168.10.254"
add name=dhcp_pool6 ranges=192.168.20.2-192.168.20.254
add name=dhcp_pool7 ranges=192.168.30.2-192.168.30.254
add name=dhcp_invitados ranges=192.168.101.51-192.168.101.254
add name=dhcp_pool9 ranges=192.168.40.2-192.168.40.254
/ip dhcp-server
add address-pool=dhcp_pool4 interface=bridge lease-script=dhcp_lease_script \
    lease-time=10m name=dhcp_Gestion
add address-pool=dhcp_CCTV interface=vlan10_CCTV lease-script=\
    dhcp_lease_script lease-time=10m name=dhcp_CCTV
add address-pool=dhcp_pool6 interface=vlan20_Datos lease-script=\
    dhcp_lease_script lease-time=10m name=dhcp_Datos
add address-pool=dhcp_pool7 interface=vlan30_telefonia_Acceso lease-script=\
    dhcp_lease_script lease-time=10m name=dhcp_Telefonia
add address-pool=dhcp_pool9 interface=vlan40_Invitados lease-script=\
    dhcp_lease_script lease-time=10m name=dhcp_Invitados
/port
set 0 name=serial0
set 1 name=serial1
/queue simple
add limit-at=20M/20M max-limit=20M/20M name=Total_Invitados target=\
    vlan40_Invitados
add name=Voip-SIP packet-marks=voip-sip priority=1/1 target=\
    bridge,vlan30_telefonia_Acceso,vlan20_Datos,vlan10_CCTV,vlan40_Invitados
add name=Voip-RTP packet-marks=voip-rtp priority=1/1 target=\
    bridge,vlan30_telefonia_Acceso,vlan20_Datos,vlan10_CCTV,vlan40_Invitados
add max-limit=2048k/5120k name=Invitados parent=Total_Invitados queue=\
    pcq-upload-default/pcq-download-default target=vlan40_Invitados
/routing pimsm instance
add disabled=yes name=pimsm-instance1 vrf=main
/snmp community
set [ find default=yes ] disabled=yes
add addresses=::/0 name=infratec2024*
/system logging action
set 0 memory-lines=4000
set 1 disk-file-count=10 disk-file-name=log.txt
set 3 bsd-syslog=yes remote=192.168.20.42 syslog-facility=syslog
/zerotier
set zt1 comment="ZeroTier Central controller - https://my.zerotier.com/" \
    disabled=yes disabled=yes identity="d0e8ea6740:0:8684f976d8445b386906bd6bc\
    1183c7c5796fd70265d20f374eb6644c077d11120bd4737397fa53426268a4a28dcb40e8ba\
    bdd78f801408e7d9c170297d370fe:21d4cc834d527f291db7a027338e039b409d58917590\
    da99bfaa4fc6e0f1c1258d9ed29f16dc07964177c7f276281fb7190ecaa831dfdaf6c1aa5e\
    4b34157f5d" name=zt1 port=9993
/interface bridge port
add bridge=bridge interface=ether2
add bridge=bridge interface=ether3
add bridge=bridge interface=ether4
add bridge=bridge interface=ether5
add bridge=bridge interface=ether6_CORE16
add bridge=bridge interface=ether7
add bridge=bridge interface=ether8
add bridge=bridge interface=ether9
add bridge=bridge interface=ether10
add bridge=bridge interface=ether11
add bridge=bridge interface=ether12
/interface bridge settings
set allow-fast-path=no use-ip-firewall=yes use-ip-firewall-for-vlan=yes
/ip neighbor discovery-settings
set discover-interface-list=all
/ip settings
set max-neighbor-entries=8192
/ipv6 settings
set disable-ipv6=yes max-neighbor-entries=8192
/interface l2tp-server server
set enabled=yes ipsec-secret=st21232123. use-ipsec=yes
/interface ovpn-server server
set auth=sha1,md5
/interface wireguard peers
add allowed-address=10.1.1.2/32 disabled=yes interface=wireguard1 public-key=\
    "vJAmUr0YQSSezkpMkM9Eezag7Rdp88aNjDVHOyUFz0s="
/ip address
add address=192.168.10.1/24 interface=vlan10_CCTV network=192.168.10.0
add address=192.168.20.1/24 interface=vlan20_Datos network=192.168.20.0
add address=192.168.40.1/24 interface=vlan40_Invitados network=192.168.40.0
add address=10.0.10.1/24 interface=bridge network=10.0.10.0
add address=10.0.153.254/24 interface=bridge network=10.0.153.0
add address=192.168.30.1/24 interface=vlan30_telefonia_Acceso network=\
    192.168.30.0
/ip arp
add address=192.168.30.16 interface=vlan30_telefonia_Acceso mac-address=\
    C0:74:AD:63:96:2A
/ip cloud
set ddns-enabled=yes
/ip dhcp-client
add default-route-distance=2 interface=ether13_LTErouter
/ip dhcp-server alert
add disabled=no interface=vlan10_CCTV
add disabled=no interface=vlan20_Datos
add disabled=no interface=vlan30_telefonia_Acceso
add disabled=no interface=vlan40_Invitados
/ip dhcp-server lease
add address=10.0.10.249 client-id=1:78:45:58:ba:b7:be mac-address=\
    78:45:58:BA:B7:BE server=dhcp_Gestion
add address=10.0.10.252 client-id=1:78:45:58:ba:b7:52 mac-address=\
    78:45:58:BA:B7:52 server=dhcp_Gestion
add address=10.0.10.251 client-id=1:78:45:58:ba:b7:5b mac-address=\
    78:45:58:BA:B7:5B server=dhcp_Gestion
add address=10.0.10.250 client-id=1:78:45:58:ba:b9:14 mac-address=\
    78:45:58:BA:B9:14 server=dhcp_Gestion
add address=10.0.10.245 client-id=1:78:45:58:ef:11:65 comment=\
    "\F0\9F\9B\9C Antena P4" mac-address=78:45:58:EF:11:65 server=\
    dhcp_Gestion
add address=10.0.10.244 client-id=1:78:45:58:f3:22:3b comment=\
    "\F0\9F\9B\9C Antena P4" mac-address=78:45:58:F3:22:3B server=\
    dhcp_Gestion
add address=10.0.10.246 client-id=1:78:45:58:ee:e2:71 comment=\
    "\F0\9F\9B\9C Antena P4" mac-address=78:45:58:EE:E2:71 server=\
    dhcp_Gestion
add address=10.0.10.241 client-id=1:78:45:58:f3:13:77 comment=\
    "\F0\9F\9B\9C Antena P4" mac-address=78:45:58:F3:13:77 server=\
    dhcp_Gestion
add address=10.0.10.226 client-id=1:78:45:58:ba:b9:fb comment=\
    "\F0\9F\94\80R2-SW3-Unifi" mac-address=78:45:58:BA:B9:FB server=\
    dhcp_Gestion
add address=10.0.10.224 client-id=1:78:45:58:f3:38:bf comment=\
    "\F0\9F\9B\9C Antena PB-1" mac-address=78:45:58:F3:38:BF server=\
    dhcp_Gestion
add address=10.0.10.223 client-id=1:78:45:58:ee:e1:fd comment=\
    "\F0\9F\9B\9C Antena PB-2" mac-address=78:45:58:EE:E1:FD server=\
    dhcp_Gestion
add address=10.0.10.222 client-id=1:78:45:58:f3:36:6f comment=\
    "\F0\9F\9B\9C Antena PB-3" mac-address=78:45:58:F3:36:6F server=\
    dhcp_Gestion
add address=10.0.10.221 client-id=1:78:45:58:ba:b9:ce comment=\
    "\F0\9F\94\80R2-SW1-Unifi" mac-address=78:45:58:BA:B9:CE server=\
    dhcp_Gestion
add address=192.168.30.245 client-id=1:c0:74:ad:54:11:50 comment=\
    "\F0\9F\93\B2 VideoPortero 1" mac-address=C0:74:AD:54:11:50 server=\
    dhcp_Telefonia
add address=192.168.30.251 client-id=1:c0:74:ad:63:96:2f comment=\
    "\F0\9F\93\9E interno 1005" mac-address=C0:74:AD:63:96:2F server=\
    dhcp_Telefonia
add address=192.168.30.242 client-id=1:c0:74:ad:63:96:2c comment=\
    "\F0\9F\93\9E interno 1006" mac-address=C0:74:AD:63:96:2C server=\
    dhcp_Telefonia
add address=192.168.30.244 client-id=1:c0:74:ad:63:95:fd mac-address=\
    C0:74:AD:63:95:FD server=dhcp_Telefonia
add address=192.168.30.236 client-id=1:c0:74:ad:63:96:29 comment=\
    "\F0\9F\93\9E interno 1011" mac-address=C0:74:AD:63:96:29 server=\
    dhcp_Telefonia
add address=192.168.30.240 client-id=1:c0:74:ad:65:49:21 comment=\
    "\F0\9F\93\9E interno 1009" mac-address=C0:74:AD:65:49:21 server=\
    dhcp_Telefonia
add address=192.168.30.237 client-id=1:c0:74:ad:65:49:36 comment=\
    "\F0\9F\93\9E interno 1010" mac-address=C0:74:AD:65:49:36 server=\
    dhcp_Telefonia
add address=192.168.30.238 client-id=1:c0:74:ad:63:96:2d comment=\
    "\F0\9F\93\9E interno 1008" mac-address=C0:74:AD:63:96:2D server=\
    dhcp_Telefonia
add address=192.168.30.239 client-id=1:c0:74:ad:65:49:30 comment=\
    "\F0\9F\93\9E interno 1002" mac-address=C0:74:AD:65:49:30 server=\
    dhcp_Telefonia
add address=192.168.30.235 client-id=1:c0:74:ad:65:49:2a comment=\
    "\F0\9F\93\9E interno 1004" mac-address=C0:74:AD:65:49:2A server=\
    dhcp_Telefonia
add address=192.168.30.243 client-id=1:c0:74:ad:63:96:28 comment=\
    "\F0\9F\93\9E interno 1004" mac-address=C0:74:AD:63:96:28 server=\
    dhcp_Telefonia
add address=192.168.30.234 client-id=1:c0:74:ad:50:93:72 comment=\
    "\F0\9F\93\9E interno 501 - Of Alvaro" mac-address=C0:74:AD:50:93:72 \
    server=dhcp_Telefonia
add address=192.168.30.231 client-id=1:c0:74:ad:63:96:2a comment=\
    "\F0\9F\93\9E interno 702 - " mac-address=C0:74:AD:63:96:2A server=\
    dhcp_Telefonia
add address=192.168.30.230 client-id=1:c0:74:ad:63:96:21 comment=\
    "\F0\9F\93\9E interno 502 " mac-address=C0:74:AD:63:96:21 server=\
    dhcp_Telefonia
add address=192.168.30.229 client-id=1:c0:74:ad:63:96:2e comment=\
    "\F0\9F\93\9E interno 603" mac-address=C0:74:AD:63:96:2E server=\
    dhcp_Telefonia
add address=192.168.30.233 client-id=1:c0:74:ad:63:96:2b comment=\
    "\F0\9F\93\9E interno 602" mac-address=C0:74:AD:63:96:2B server=\
    dhcp_Telefonia
add address=192.168.30.232 client-id=1:c0:74:ad:63:96:35 comment=\
    "\F0\9F\93\9E interno 502 - compras" mac-address=C0:74:AD:63:96:35 \
    server=dhcp_Telefonia
add address=192.168.30.224 client-id=1:c0:74:ad:65:2d:cf comment=\
    "\F0\9F\93\9E interno 103 - ventas 3" mac-address=C0:74:AD:65:2D:CF \
    server=dhcp_Telefonia
add address=192.168.30.223 client-id=1:c0:74:ad:65:2d:d0 comment=\
    "\F0\9F\93\9E interno 201 - Oficina Deybi" mac-address=C0:74:AD:65:2D:D0 \
    server=dhcp_Telefonia
add address=192.168.30.222 client-id=1:c0:74:ad:65:2d:de comment=\
    "\F0\9F\93\9E interno 106 - ventas 6" mac-address=C0:74:AD:65:2D:DE \
    server=dhcp_Telefonia
add address=192.168.30.221 client-id=1:c0:74:ad:65:2d:db comment=\
    "\F0\9F\93\9E interno 105 - ventas5" mac-address=C0:74:AD:65:2D:DB \
    server=dhcp_Telefonia
add address=192.168.30.220 client-id=1:c0:74:ad:65:2d:e2 comment=\
    "\F0\9F\93\9E interno 106 - ventas1" mac-address=C0:74:AD:65:2D:E2 \
    server=dhcp_Telefonia
add address=192.168.30.219 client-id=1:c0:74:ad:65:49:35 comment=\
    "\F0\9F\93\9E interno 102 - ventas2" mac-address=C0:74:AD:65:49:35 \
    server=dhcp_Telefonia
add address=192.168.30.218 client-id=1:c0:74:ad:65:2d:d7 comment=\
    "\F0\9F\93\9E interno 202 - adm1" mac-address=C0:74:AD:65:2D:D7 server=\
    dhcp_Telefonia
add address=192.168.30.217 client-id=1:c0:74:ad:65:2d:d6 comment=\
    "\F0\9F\93\9E interno 203 - admin2" mac-address=C0:74:AD:65:2D:D6 server=\
    dhcp_Telefonia
add address=192.168.30.216 client-id=1:c0:74:ad:65:49:31 comment=\
    "\F0\9F\93\9E interno 901" mac-address=C0:74:AD:65:49:31 server=\
    dhcp_Telefonia
add address=192.168.30.215 client-id=1:c0:74:ad:65:49:28 comment=\
    "\F0\9F\93\9E interno 301" mac-address=C0:74:AD:65:49:28 server=\
    dhcp_Telefonia
add address=192.168.30.214 client-id=1:c0:74:ad:65:2d:dd comment=\
    "\F0\9F\93\9E interno 204 - adm3" mac-address=C0:74:AD:65:2D:DD server=\
    dhcp_Telefonia
add address=192.168.30.213 client-id=1:c0:74:ad:52:1c:c9 comment=\
    "\F0\9F\93\B2 VideoPortero 2" mac-address=C0:74:AD:52:1C:C9 server=\
    dhcp_Telefonia
add address=192.168.30.226 client-id=1:c0:74:ad:63:96:33 comment=\
    "\F0\9F\93\9E interno 1102" mac-address=C0:74:AD:63:96:33 server=\
    dhcp_Telefonia
add address=192.168.30.228 client-id=1:c0:74:ad:65:2d:df comment=\
    "\F0\9F\93\9E interno 1201" mac-address=C0:74:AD:65:2D:DF server=\
    dhcp_Telefonia
add address=192.168.30.227 client-id=1:c0:74:ad:65:2d:e3 comment=\
    "\F0\9F\93\9E interno 1101" mac-address=C0:74:AD:65:2D:E3 server=\
    dhcp_Telefonia
add address=192.168.30.225 client-id=1:c0:74:ad:65:2d:e7 comment=\
    "\F0\9F\93\9E interno 1001" mac-address=C0:74:AD:65:2D:E7 server=\
    dhcp_Telefonia
add address=192.168.30.210 client-id=1:c0:74:ad:65:49:2d comment=\
    "\F0\9F\93\9E interno 801" mac-address=C0:74:AD:65:49:2D server=\
    dhcp_Telefonia
add address=192.168.30.209 client-id=1:c0:74:ad:65:2d:d9 comment=\
    "\F0\9F\93\9E interno 402 - Caja2" mac-address=C0:74:AD:65:2D:D9 server=\
    dhcp_Telefonia
add address=192.168.30.207 client-id=1:c0:74:ad:50:93:6d comment=\
    "\F0\9F\93\9E interno 601 - contador" mac-address=C0:74:AD:50:93:6D \
    server=dhcp_Telefonia
add address=192.168.30.206 client-id=1:c0:74:ad:50:93:77 comment=\
    "\F0\9F\93\9E interno 1301 - reuniones" mac-address=C0:74:AD:50:93:77 \
    server=dhcp_Telefonia
add address=192.168.30.205 client-id=1:c0:74:ad:63:96:27 comment=\
    "\F0\9F\93\9E interno 701" mac-address=C0:74:AD:63:96:27 server=\
    dhcp_Telefonia
add address=10.0.10.214 client-id=1:78:45:58:f3:30:23 comment=\
    "\F0\9F\9B\9C Antena P3-1" mac-address=78:45:58:F3:30:23 server=\
    dhcp_Gestion
add address=192.168.30.201 client-id=1:c0:74:ad:65:2d:cb comment=\
    "\F0\9F\93\9E interno 401" mac-address=C0:74:AD:65:2D:CB server=\
    dhcp_Telefonia
add address=192.168.30.200 client-id=1:c0:74:ad:65:2d:d4 comment=\
    "\F0\9F\93\9E interno 802" mac-address=C0:74:AD:65:2D:D4 server=\
    dhcp_Telefonia
add address=192.168.30.197 client-id=1:c0:74:ad:63:96:34 comment=\
    "\F0\9F\93\9E interno 503 - compras" mac-address=C0:74:AD:63:96:34 \
    server=dhcp_Telefonia
add address=192.168.30.196 client-id=1:c0:74:ad:63:96:5 comment=\
    "\F0\9F\93\9E interno 505 - compras" mac-address=C0:74:AD:63:96:05 \
    server=dhcp_Telefonia
add address=10.0.10.213 client-id=1:78:45:58:f3:c:23 comment=\
    "\F0\9F\9B\9C Antena P2" mac-address=78:45:58:F3:0C:23 server=\
    dhcp_Gestion
add address=192.168.30.198 client-id=1:c0:74:ad:65:2d:da comment=\
    "\F0\9F\93\9E interno 104 - Ventas 4" mac-address=C0:74:AD:65:2D:DA \
    server=dhcp_Telefonia
add address=192.168.30.195 client-id=1:c0:74:ad:26:b3:54 comment=\
    "\F0\9F\96\B5 Pantalla GM 2- ventas" mac-address=C0:74:AD:26:B3:54 \
    server=dhcp_Telefonia
add address=192.168.30.194 client-id=1:c0:74:ad:26:b3:28 comment=\
    "\F0\9F\96\B5 Pantalla GM1 - Ventas" mac-address=C0:74:AD:26:B3:28 \
    server=dhcp_Telefonia
add address=192.168.30.193 client-id=1:c0:74:ad:26:b3:4 comment=\
    "\F0\9F\93\B2 Portero Expedicion 1" mac-address=C0:74:AD:26:B3:04 server=\
    dhcp_Telefonia
add address=10.0.10.208 client-id=1:78:45:58:f3:34:1b comment=\
    "\F0\9F\9B\9C Antena P1 - 1" mac-address=78:45:58:F3:34:1B server=\
    dhcp_Gestion
add address=192.168.30.192 client-id=1:c0:74:ad:26:b3:44 comment=\
    "\F0\9F\93\B2 Portero Entrega 1" mac-address=C0:74:AD:26:B3:44 server=\
    dhcp_Telefonia
add address=192.168.30.199 client-id=1:c0:74:ad:65:2d:d3 comment=\
    "\F0\9F\93\9E interno 803" mac-address=C0:74:AD:65:2D:D3 server=\
    dhcp_Telefonia
add address=192.168.30.191 client-id=1:c0:74:ad:26:b3:34 comment=\
    "\F0\9F\96\B5 PB caja 1 Pantalla" mac-address=C0:74:AD:26:B3:34 server=\
    dhcp_Telefonia
add address=192.168.30.190 client-id=1:c0:74:ad:26:b3:50 comment=\
    "\F0\9F\96\B5 PB Pantalla Oficina 2" mac-address=C0:74:AD:26:B3:50 \
    server=dhcp_Telefonia
add address=192.168.30.189 client-id=1:c0:74:ad:26:b3:38 comment=\
    "Cambio pantalla Caja 1" mac-address=C0:74:AD:26:B3:38 server=\
    dhcp_Telefonia
add address=192.168.20.214 client-id=1:0:17:c8:c8:21:6b comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:C8:21:6B server=\
    dhcp_Datos
add address=192.168.20.213 client-id=1:0:17:c8:c8:21:55 comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:C8:21:55 server=\
    dhcp_Datos
add address=192.168.20.212 client-id=1:0:17:c8:c8:21:61 comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:C8:21:61 server=\
    dhcp_Datos
add address=192.168.20.211 client-id=1:0:17:c8:c8:21:5b comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:C8:21:5B server=\
    dhcp_Datos
add address=192.168.20.210 client-id=1:0:17:c8:c8:21:53 comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:C8:21:53 server=\
    dhcp_Datos
add address=192.168.20.209 client-id=1:0:17:c8:c8:21:5d comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora entrega" mac-address=00:17:C8:C8:21:5D \
    server=dhcp_Datos
add address=192.168.20.208 client-id=1:0:17:c8:c8:21:65 comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:C8:21:65 server=\
    dhcp_Datos
add address=192.168.20.207 client-id=1:0:17:c8:c8:21:60 comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:C8:21:60 server=\
    dhcp_Datos
add address=192.168.20.206 client-id=1:0:17:c8:c8:11:41 comment=\
    "\F0\9F\96\A8\EF\B8\8Fimpresora administracion" mac-address=\
    00:17:C8:C8:11:41 server=dhcp_Datos
add address=192.168.20.204 client-id=1:50:9a:4c:3d:32:8e comment=\
    "\F0\9F\96\A5\EF\B8\8F PC ADM 3" mac-address=50:9A:4C:3D:32:8E server=\
    dhcp_Datos
add address=192.168.20.203 client-id=1:50:9a:4c:3e:30:94 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC ADM 1" mac-address=50:9A:4C:3E:30:94 server=\
    dhcp_Datos
add address=192.168.20.202 client-id=1:50:9a:4c:3d:84:50 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Ventas 1" mac-address=50:9A:4C:3D:84:50 server=\
    dhcp_Datos
add address=192.168.20.200 client-id=1:50:9a:4c:3d:6d:79 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Ventas 5" mac-address=50:9A:4C:3D:6D:79 server=\
    dhcp_Datos
add address=192.168.20.199 client-id=1:50:9a:4c:3e:2f:67 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Ventas 4" mac-address=50:9A:4C:3E:2F:67 server=\
    dhcp_Datos
add address=192.168.20.198 client-id=1:50:9a:4c:4d:49:15 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Ventas 6" mac-address=50:9A:4C:4D:49:15 server=\
    dhcp_Datos
add address=192.168.20.197 client-id=1:50:9a:4c:3d:31:86 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC ADM2 - IVMS Deybis" mac-address=\
    50:9A:4C:3D:31:86 server=dhcp_Datos
add address=192.168.20.196 client-id=1:50:9a:4c:3e:2e:86 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Caja 2" mac-address=50:9A:4C:3E:2E:86 server=\
    dhcp_Datos
add address=192.168.20.195 client-id=1:50:9a:4c:3e:30:d comment=\
    "\F0\9F\96\A5\EF\B8\8F PC ventas 3" mac-address=50:9A:4C:3E:30:0D server=\
    dhcp_Datos
add address=192.168.20.194 client-id=1:50:9a:4c:3d:80:99 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Ventas 2" mac-address=50:9A:4C:3D:80:99 server=\
    dhcp_Datos
add address=192.168.20.191 client-id=1:50:9a:4c:3d:41:b4 comment=\
    "\F0\9F\96\A5\EF\B8\8F\F0\9F\92\B0 PC Caja 1" mac-address=\
    50:9A:4C:3D:41:B4 server=dhcp_Datos
add address=192.168.20.190 client-id=1:50:9a:4c:4f:cf:34 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Logisitca 1" mac-address=50:9A:4C:4F:CF:34 \
    server=dhcp_Datos
add address=192.168.20.189 client-id=1:50:9a:4c:3d:31:27 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:3D:31:27 server=\
    dhcp_Datos
add address=192.168.20.188 client-id=1:50:9a:4c:50:16:28 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Armado PT7" mac-address=50:9A:4C:50:16:28 \
    server=dhcp_Datos
add address=192.168.20.187 client-id=1:50:9a:4c:4f:ca:89 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:4F:CA:89 server=\
    dhcp_Datos
add address=192.168.20.186 client-id=1:50:9a:4c:50:e:4e comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:50:0E:4E server=\
    dhcp_Datos
add address=192.168.20.185 client-id=1:50:9a:4c:3e:2b:fc comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:3E:2B:FC server=\
    dhcp_Datos
add address=192.168.20.182 client-id=1:50:9a:4c:3d:76:23 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:3D:76:23 server=\
    dhcp_Datos
add address=192.168.20.181 client-id=1:50:9a:4c:50:12:d7 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:50:12:D7 server=\
    dhcp_Datos
add address=192.168.30.165 comment="\F0\9F\9A\A8 Alarma GPRS" mac-address=\
    00:03:4F:62:39:51 server=dhcp_Telefonia
add address=192.168.20.172 client-id=1:50:9a:4c:3d:80:c2 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:3D:80:C2 server=\
    dhcp_Datos
add address=192.168.20.169 client-id=1:50:9a:4c:50:32:ec comment=\
    "\F0\9F\96\A5\EF\B8\8F\F0\9F\A4\93 PC Deiby" mac-address=\
    50:9A:4C:50:32:EC server=dhcp_Datos
add address=192.168.20.168 client-id=1:50:9a:4c:4d:69:af comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:4D:69:AF server=\
    dhcp_Datos
add address=192.168.20.167 client-id=1:0:17:c8:c8:21:67 comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora ventas 1" mac-address=00:17:C8:C8:21:67 \
    server=dhcp_Datos
add address=192.168.20.166 client-id=1:d4:7b:b0:16:4b:da comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=D4:7B:B0:16:4B:DA server=\
    dhcp_Datos
add address=192.168.20.150 client-id=1:50:9a:4c:3e:2e:bb comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Expedicion 2" mac-address=50:9A:4C:3E:2E:BB \
    server=dhcp_Datos
add address=192.168.20.246 client-id=1:d8:f8:83:70:10:6b comment=\
    "\F0\9F\96\A5\EF\B8\8F\F0\9F\A4\93  PC Alvaro" mac-address=\
    D8:F8:83:70:10:6B server=dhcp_Datos
add address=192.168.10.4 client-id=1:50:9a:4c:3e:31:1 comment=\
    "\F0\9F\96\A5\EF\B8\8F\F0\9F\A4\93PC Alvaro" mac-address=\
    50:9A:4C:3E:31:01 server=dhcp_CCTV
add address=192.168.30.159 client-id=1:c0:74:ad:63:96:37 comment=\
    "\F0\9F\93\9E interno 1012" mac-address=C0:74:AD:63:96:37 server=\
    dhcp_Telefonia
add address=192.168.20.215 client-id=1:74:27:ea:21:c0:86 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC Publicidad" mac-address=74:27:EA:21:C0:86 \
    server=dhcp_Datos
add address=192.168.20.42 client-id=1:50:9a:4c:3d:81:5a comment=\
    "\F0\9F\96\A5\EF\B8\8F PRTG Server - 195.79" mac-address=\
    50:9A:4C:3D:81:5A server=dhcp_Datos
add address=10.0.10.179 client-id=1:d8:b3:70:29:da:85 comment=\
    "\F0\9F\94\80 R2-SW4-Unifi-Cambiado" mac-address=D8:B3:70:29:DA:85 \
    server=dhcp_Gestion
add address=10.0.10.175 client-id=1:f4:e2:c6:b0:8a:aa comment=\
    "\F0\9F\94\80 R1-S1-CORE" mac-address=F4:E2:C6:B0:8A:AA server=\
    dhcp_Gestion
add address=10.0.10.174 client-id=1:d8:b3:70:40:d0:f1 comment=\
    "\F0\9F\94\80 R1-SW48-nuevo" mac-address=D8:B3:70:40:D0:F1 server=\
    dhcp_Gestion
add address=10.0.10.173 client-id=1:d8:b3:70:40:d0:5b comment=\
    "\F0\9F\94\80 R1-SW48-nuevo-Core" mac-address=D8:B3:70:40:D0:5B server=\
    dhcp_Gestion
add address=10.0.10.167 client-id=1:d8:b3:70:40:d4:24 comment=\
    "\F0\9F\94\80 R2-SW2-48-nuevo" mac-address=D8:B3:70:40:D4:24 server=\
    dhcp_Gestion
add address=192.168.20.107 client-id=1:ec:b1:d7:3a:4c:61 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=EC:B1:D7:3A:4C:61 server=\
    dhcp_Datos
add address=192.168.20.105 client-id=1:ec:b1:d7:34:fc:e8 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=EC:B1:D7:34:FC:E8 server=\
    dhcp_Datos
add address=192.168.20.145 client-id=1:44:37:e6:9a:81:ff comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=44:37:E6:9A:81:FF server=\
    dhcp_Datos
add address=192.168.20.151 client-id=1:50:9a:4c:3e:30:6f comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:3E:30:6F server=\
    dhcp_Datos
add address=192.168.20.161 client-id=1:50:9a:4c:3e:2a:b0 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:3E:2A:B0 server=\
    dhcp_Datos
add address=192.168.20.62 client-id=1:0:17:c8:ca:3d:d1 comment=\
    "\F0\9F\96\A8\EF\B8\8F impresora" mac-address=00:17:C8:CA:3D:D1 server=\
    dhcp_Datos
add address=192.168.20.238 client-id=1:50:9a:4c:4d:51:c4 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:4D:51:C4 server=\
    dhcp_Datos
add address=192.168.20.114 client-id=1:78:8c:b5:98:f5:75 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=78:8C:B5:98:F5:75 server=\
    dhcp_Datos
add address=192.168.20.2 client-id=1:78:8c:b5:98:f6:88 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=78:8C:B5:98:F6:88 server=\
    dhcp_Datos
add address=192.168.20.149 client-id=1:5c:62:8b:9d:60:4e comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=5C:62:8B:9D:60:4E server=\
    dhcp_Datos
add address=192.168.20.193 client-id=1:0:d8:61:49:5e:45 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=00:D8:61:49:5E:45 server=\
    dhcp_Datos
add address=192.168.20.54 client-id=1:50:9a:4c:50:e:49 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:50:0E:49 server=\
    dhcp_Datos
add address=192.168.20.143 client-id=1:ec:b1:d7:3d:44:95 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=EC:B1:D7:3D:44:95 server=\
    dhcp_Datos
add address=10.0.10.161 client-id=1:50:9a:4c:3d:6d:79 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=50:9A:4C:3D:6D:79 server=\
    dhcp_Gestion
add address=10.0.10.144 client-id=1:9c:5:d6:a7:d2:35 comment="\F0\9F\94\80" \
    mac-address=9C:05:D6:A7:D2:35 server=dhcp_Gestion
add address=10.0.10.143 client-id=1:9c:5:d6:a7:e3:91 mac-address=\
    9C:05:D6:A7:E3:91 server=dhcp_Gestion
add address=10.0.10.140 client-id=1:9c:5:d6:a9:44:1 comment="\F0\9F\94\80" \
    mac-address=9C:05:D6:A9:44:01 server=dhcp_Gestion
add address=10.0.10.139 client-id=1:9c:5:d6:a9:2c:65 comment="\F0\9F\94\80" \
    mac-address=9C:05:D6:A9:2C:65 server=dhcp_Gestion
add address=10.0.10.149 client-id=1:9c:5:d6:a7:b7:81 mac-address=\
    9C:05:D6:A7:B7:81 server=dhcp_Gestion
add address=10.0.10.146 client-id=1:9c:5:d6:a9:25:c9 comment="\F0\9F\94\80" \
    mac-address=9C:05:D6:A9:25:C9 server=dhcp_Gestion
add address=10.0.10.148 client-id=1:9c:5:d6:a8:3:21 mac-address=\
    9C:05:D6:A8:03:21 server=dhcp_Gestion
add address=10.0.10.145 client-id=1:9c:5:d6:a9:3e:b1 comment="\F0\9F\94\80" \
    mac-address=9C:05:D6:A9:3E:B1 server=dhcp_Gestion
add address=192.168.20.102 client-id=1:ec:b1:d7:35:d8:24 comment=\
    "\F0\9F\96\A5\EF\B8\8F PC" mac-address=EC:B1:D7:35:D8:24 server=\
    dhcp_Datos
add address=192.168.20.89 client-id=\
    ff:ca:53:9:5a:0:2:0:0:ab:11:75:d:b1:69:f5:65:c5:ca comment=\
    "UniFi Controller" mac-address=BC:24:11:95:F2:6F server=dhcp_Datos
add address=192.168.20.93 client-id=\
    ff:ca:53:9:5a:0:2:0:0:ab:11:66:be:c7:3d:78:54:50:ad comment=KUMA \
    mac-address=BC:24:11:10:9E:8C server=dhcp_Datos
add address=10.0.10.137 client-id=1:f4:e2:c6:a9:fd:5e comment="\F0\9F\94\80" \
    mac-address=F4:E2:C6:A9:FD:5E server=dhcp_Gestion
add address=10.0.10.141 client-id=1:f4:e2:c6:a9:f9:80 mac-address=\
    F4:E2:C6:A9:F9:80 server=dhcp_Gestion
add address=10.0.10.136 client-id=1:f4:e2:c6:a9:f4:be comment="\F0\9F\94\80" \
    mac-address=F4:E2:C6:A9:F4:BE server=dhcp_Gestion
add address=10.0.10.147 client-id=1:f4:e2:c6:a9:e9:72 mac-address=\
    F4:E2:C6:A9:E9:72 server=dhcp_Gestion
add address=10.0.10.150 client-id=1:d8:b3:70:9f:55:c4 mac-address=\
    D8:B3:70:9F:55:C4 server=dhcp_Gestion
/ip dhcp-server network
add address=10.0.10.0/24 dhcp-option=unifi-controller dns-server=8.8.8.8 \
    gateway=10.0.10.1
add address=10.0.101.0/24 dhcp-option=unifi-controller dns-server=8.8.8.8 \
    gateway=10.0.101.1
add address=192.168.10.0/24 dhcp-option=unifi-controller dns-server=8.8.8.8 \
    gateway=192.168.10.1
add address=192.168.20.0/24 dhcp-option=unifi-controller dns-server=8.8.8.8 \
    gateway=192.168.20.1
add address=192.168.30.0/24 dhcp-option=unifi-controller dns-server=8.8.8.8 \
    gateway=192.168.30.1
add address=192.168.40.0/24 dhcp-option=unifi-controller dns-server=8.8.8.8 \
    gateway=192.168.40.1
add address=192.168.101.0/24 dhcp-option=unifi-controller dns-server=\
    8.8.8.8,1.1.1.1 gateway=192.168.101.1
/ip dns
set allow-remote-requests=yes servers=8.8.8.8,200.40.30.245
/ip firewall address-list
add address=192.168.30.0/24 list=Telefonia_Acceso
add address=192.168.10.0/24 list=Cctv
add address=192.168.101.0/24 list=Invitados
add address=192.168.20.0/24 list=Corpo
/ip firewall filter
add action=accept chain=input dst-address=192.168.30.100
add action=accept chain=forward dst-address=192.168.30.100
add action=accept chain=forward dst-address=192.168.20.0/24 dst-port=3702 \
    protocol=udp src-address=192.168.10.0/24
add action=accept chain=forward dst-address=192.168.10.0/24 dst-port=3702 \
    protocol=udp src-address=192.168.20.0/24
add action=accept chain=input in-interface=wireguard1
add action=drop chain=input comment=\
    "Bloqueo Peticiones desde internet DNS hacia el MK" dst-port=53 \
    in-interface=pppoe-out1 protocol=udp
add action=drop chain=input comment="Bloqueo SIP en la WAN" dst-port=5060 \
    in-interface=pppoe-out1 protocol=udp
add action=drop chain=forward disabled=yes dst-address=192.168.101.0/24 \
    src-address=192.168.30.0/24
add action=drop chain=forward disabled=yes dst-address=192.168.30.0/24 \
    src-address=192.168.101.0/24
add action=drop chain=forward disabled=yes dst-address-list=Corpo \
    src-address-list=Invitados
add action=drop chain=forward disabled=yes dst-address-list=Telefonia_Acceso \
    src-address-list=Invitados
add action=drop chain=forward disabled=yes dst-address-list=Invitados \
    src-address-list=Telefonia_Acceso
add action=drop chain=forward disabled=yes dst-address-list=Cctv \
    src-address-list=Invitados
add action=drop chain=input disabled=yes dst-address-list=Corpo \
    src-address-list=Invitados
add action=drop chain=input disabled=yes dst-address-list=Telefonia_Acceso \
    src-address-list=Invitados
add action=drop chain=input disabled=yes dst-address-list=Cctv \
    src-address-list=Invitados
add action=drop chain=input disabled=yes dst-address-list=Invitados \
    src-address-list=Telefonia_Acceso
/ip firewall mangle
add action=mark-connection chain=postrouting dst-address=192.168.30.2 \
    dst-port=5060 new-connection-mark=SIP_Conn passthrough=yes protocol=udp
add action=mark-connection chain=postrouting dst-address=192.168.30.2 \
    dst-port=5060 new-connection-mark=SIP_Conn passthrough=yes protocol=tcp
add action=mark-connection chain=forward dst-address=192.168.30.2 dst-port=\
    5060 new-connection-mark=SIP_Conn_FW passthrough=no protocol=udp
add action=mark-connection chain=input dst-address=192.168.30.2 dst-port=5060 \
    new-connection-mark=SIP_Conn_FW2 passthrough=no protocol=udp
add action=mark-connection chain=forward dst-address=192.168.30.2 dst-port=\
    5060 new-connection-mark=SIP_Conn_FW passthrough=no protocol=tcp
add action=mark-connection chain=prerouting comment=\
    "Marco conexiones hacia NVRs" dst-address=192.168.10.10 \
    new-connection-mark=Mirando_CCTV_NVR1
add action=mark-connection chain=prerouting dst-address=192.168.10.11 \
    new-connection-mark=Mirando_CCTV_NVR2
add action=mark-connection chain=prerouting dst-address=192.168.10.12 \
    new-connection-mark=Mirando_CCTV_NVR3
add action=mark-connection chain=prerouting dst-address=192.168.10.13 \
    new-connection-mark=Mirando_CCTV_NVR4
add action=mark-connection chain=prerouting dst-address=192.168.10.14 \
    new-connection-mark=Mirando_CCTV_NVR5
add action=mark-packet chain=prerouting comment="QOS telefonia DSCP" dscp=26 \
    new-packet-mark=voip-sip passthrough=yes
add action=mark-packet chain=prerouting dscp=46 new-packet-mark=voip-rtp \
    passthrough=yes
/ip firewall nat
add action=accept chain=srcnat dst-address=192.168.30.100
add action=masquerade chain=srcnat comment="Enmascaro antel" out-interface=\
    pppoe-out1
add action=masquerade chain=srcnat comment="Enmascaro LTE HW" out-interface=\
    ether13_LTErouter
add action=masquerade chain=srcnat comment="Loopback CCTV" dst-address=\
    !192.168.10.1 src-address=192.168.10.0/24
add action=masquerade chain=srcnat comment="Loopback CCTV" dst-address=\
    !192.168.20.1 src-address=192.168.20.0/24
add action=masquerade chain=srcnat comment="Loopback CCTV" dst-address=\
    !192.168.30.1-192.168.30.2 src-address=192.168.30.0/24
add action=dst-nat chain=dstnat comment=PROXMOX dst-port=666 protocol=tcp \
    to-addresses=192.168.20.42 to-ports=8006
add action=dst-nat chain=dstnat comment=UPTIMEKUMA dst-port=3001 protocol=tcp \
    to-addresses=192.168.20.93 to-ports=3001
add action=dst-nat chain=dstnat comment="UniFi Controller" dst-port=8443 \
    protocol=tcp to-addresses=192.168.20.89 to-ports=8443
add action=dst-nat chain=dstnat comment="\F0\9F\96\A5\EF\B8\8F PROXMOX" \
    disabled=yes dst-port=10006 protocol=tcp to-addresses=192.168.20.42 \
    to-ports=8006
add action=dst-nat chain=dstnat comment=PRTG dst-port=4443 in-interface=\
    pppoe-out1 protocol=tcp to-addresses=192.168.20.42 to-ports=443
add action=dst-nat chain=dstnat comment=DVR2 dst-port=8001 protocol=tcp \
    to-addresses=192.168.10.11 to-ports=8001
add action=dst-nat chain=dstnat comment=DVR3 dst-port=8002 protocol=tcp \
    to-addresses=192.168.10.12 to-ports=8002
add action=dst-nat chain=dstnat comment=DVR4 dst-port=8004 protocol=tcp \
    to-addresses=192.168.10.14 to-ports=8004
add action=dst-nat chain=dstnat comment=DVR1 dst-port=8005 protocol=tcp \
    to-addresses=192.168.10.10 to-ports=8005
add action=dst-nat chain=dstnat dst-port=8006 protocol=tcp to-addresses=\
    192.168.10.15 to-ports=8006
add action=dst-nat chain=dstnat dst-port=8007 protocol=tcp to-addresses=\
    192.168.10.16 to-ports=8007
add action=dst-nat chain=dstnat comment="DVRs, nueva 6-12-2022" dst-port=881 \
    protocol=tcp to-addresses=192.168.10.10 to-ports=80
add action=dst-nat chain=dstnat comment=DVR4 dst-port=84 protocol=tcp \
    to-addresses=192.168.10.14 to-ports=80
add action=dst-nat chain=dstnat comment=Gestion dst-port=1111 protocol=tcp \
    to-addresses=10.0.10.216 to-ports=443
add action=dst-nat chain=dstnat comment="Control de Acceso 1" disabled=yes \
    dst-port=20001 in-interface=pppoe-out1 protocol=tcp to-addresses=\
    192.168.10.201 to-ports=8000
add action=dst-nat chain=dstnat comment="Control de Acceso 2" disabled=yes \
    dst-port=20002 in-interface=pppoe-out1 protocol=tcp to-addresses=\
    192.168.10.202 to-ports=8000
add action=dst-nat chain=dstnat comment="Control de Acceso 3" disabled=yes \
    dst-port=20003 in-interface=pppoe-out1 protocol=tcp to-addresses=\
    192.168.10.203 to-ports=8000
add action=dst-nat chain=dstnat comment="Control de Acceso 3" disabled=yes \
    dst-port=20004 in-interface=pppoe-out1 protocol=tcp to-addresses=\
    192.168.10.204 to-ports=8000
add action=dst-nat chain=dstnat comment=PRTG disabled=yes dst-port=5557 \
    in-interface=pppoe-out1 protocol=tcp to-addresses=192.168.20.42 to-ports=\
    443
add action=dst-nat chain=dstnat comment=PBX disabled=yes dst-port=8089 \
    protocol=tcp to-addresses=192.168.30.2 to-ports=8089
add action=dst-nat chain=dstnat comment=PRTG disabled=yes dst-port=443 \
    in-interface=pppoe-out1 protocol=tcp to-addresses=192.168.20.42 to-ports=\
    443
add action=dst-nat chain=dstnat dst-port=8008 protocol=tcp to-addresses=\
    192.168.10.17 to-ports=8008
/ip firewall service-port
set sip disabled=yes sip-direct-media=no
/ip route
add comment="Para test Modem LTE" disabled=yes distance=3 dst-address=\
    8.8.8.8/32 gateway=192.168.8.1 pref-src="" routing-table=main scope=30 \
    suppress-hw-offload=no target-scope=10 vrf-interface=ether13_LTErouter
/ip service
set telnet disabled=yes
set ftp disabled=yes
set www disabled=yes
set ssh port=2623
set api disabled=yes
set api-ssl disabled=yes
/ppp secret
add local-address=10.0.1.1 name=fgonzalez password=flavio20 remote-address=\
    10.0.1.2
add disabled=yes local-address=10.0.1.1 name=yus password=yus*2011 \
    remote-address=10.0.1.3
add local-address=10.0.1.1 name=mac_fla password=flavio20 remote-address=\
    10.0.1.4
/routing bfd configuration
add disabled=no
/routing igmp-proxy
set quick-leave=yes
/routing igmp-proxy interface
add disabled=yes interface=vlan10_CCTV
add disabled=yes interface=vlan20_Datos
/routing pimsm interface-template
add disabled=yes instance=pimsm-instance1 interfaces=vlan10_CCTV,vlan20_Datos
/snmp
set enabled=yes trap-community=infratec2024* trap-interfaces=all \
    trap-version=2
/system clock
set time-zone-name=America/Montevideo
/system identity
set name="Mancru SA (27-may-2025)"
/system logging
set 0 disabled=yes topics=warning,!dhcp
add topics=info,!dhcp
add action=remote topics=critical
add action=remote topics=error
add action=remote topics=info,!dhcp
add action=remote topics=warning
add topics=script
add disabled=yes topics=netwatch
add topics=system
/system note
set show-at-login=no
/system ntp client
set enabled=yes
/system ntp server
set broadcast=yes broadcast-addresses=192.168.10.255,192.168.30.255 enabled=\
    yes
/system ntp client servers
add address=uy.pool.ntp.org
/system scheduler
add interval=17w1d14h name=certificado on-event="certificate/enable-ssl-certif\
    icate dns-name=d8550fc5a75c.sn.m\r\
    \nynetname.net" policy=\
    ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon \
    start-date=2022-09-09 start-time=00:32:26
/tool graphing interface
add
/tool netwatch
add comment="\E2\98\8E\EF\B8\8F Central GM" disabled=no down-script="\
    \n" host=192.168.30.2 http-codes="" test-script="" type=simple up-script=\
    ""
add comment="\F0\9F\94\80 R1-SW4-Unifi" disabled=no down-script="" host=\
    10.0.10.252 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\80 R1-SW1-Unifi" disabled=no down-script="" host=\
    10.0.10.249 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\80 R1-SW2-Unifi" disabled=no down-script="" host=\
    10.0.10.251 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\93\BC DVR1" disabled=no down-script="" host=192.168.10.10 \
    http-codes="" test-script="" type=icmp up-script=""
add comment="\F0\9F\93\BC DVR2" disabled=no down-script="" host=192.168.10.11 \
    http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\93\BC DVR3" disabled=no down-script="" host=192.168.10.12 \
    http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\80 R2-SW3-Unifi" disabled=no down-script="" host=\
    10.0.10.226 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\80 R1-SW3-Unifi" disabled=no down-script="" host=\
    10.0.10.250 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\80 R2-SW1-Unifi" disabled=no down-script="" host=\
    10.0.10.221 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\90 Controladora de Acceso" disabled=no down-script="" \
    host=192.168.10.201 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\90 Controladora de Acceso" disabled=no down-script="" \
    host=192.168.10.202 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\90 Controladora de Acceso" disabled=no down-script="" \
    host=192.168.10.203 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\90 Controladora de Acceso" disabled=no down-script="" \
    host=192.168.10.204 http-codes="" test-script="" type=icmp up-script=""
add comment="\F0\9F\93\BC DVR4" disabled=no down-script="" host=192.168.10.14 \
    http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\90 Controladora de Acceso" disabled=no down-script="" \
    host=192.168.10.205 http-codes="" test-script="" type=icmp up-script=""
add comment="\F0\9F\96\B5 Pantalla  PB - Oficina 1" disabled=no down-script=\
    "" host=192.168.30.194 http-codes="" test-script="" type=simple \
    up-script=""
add comment="\F0\9F\96\B5 Pantalla PB - Expedicion 1" disabled=no \
    down-script="" host=192.168.30.193 http-codes="" test-script="" type=\
    simple up-script=""
add comment="\F0\9F\96\B5 Pantalla PB -  Caja 1" disabled=yes down-script="" \
    host=192.168.30.189 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\96\B5 Pantalla PB - Entrega 1" disabled=no down-script="" \
    host=192.168.30.192 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\96\B5 Pantalla PB - Ventas 2" disabled=no down-script="" \
    host=192.168.30.195 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\96\B5 Pantalla PB - Oficina 2" disabled=yes down-script=\
    "" host=192.168.30.190 http-codes="" test-script="" type=simple \
    up-script=""
add comment="\F0\9F\96\B5 Pantalla P1 - Primer piso" disabled=no down-script=\
    "" host=192.168.30.191 http-codes="" test-script="" type=simple \
    up-script=""
add comment="\F0\9F\93\B3 VideoPortero1" disabled=no down-script="" host=\
    192.168.30.245 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\93\B3 VideoPortero2" disabled=no down-script="" host=\
    192.168.30.213 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\9B\9C Modem HW LTE" disabled=no down-script="" host=\
    192.168.8.1 http-codes="" interval=30s test-script="" type=icmp \
    up-script=""
add comment="\F0\9F\8C\90 Google" disabled=no down-script=":local botTelegramT\
    oken \"6148413066:AAHkYdwWywMKePSJgODzsmuSajd5pUM81GU\"\
    \n:local telegramChatID \"-885528647\"\
    \n:local parseMode \"html\"\
    \n:local disablePreview \"True\"\
    \n/interface pppoe-client\
    \n:local pppoeUptime    ([monitor pppoe-out1 once as-value]->\"uptime\")\
    \n:local upTime [/system resource get uptime]\
    \n:put \$upTime\
    \n\
    \n:local textToSend \"<b>MANCRU</b> %0A %0AMK dice:  ERROR Ping a Google 8\
    .8.8.8 %0APPPoE Uptime: \$pppoeUptime %0AUptime del MK: \$upTime%0AIPCloud\
    \_MK: d8550fc5a75c.sn.mynetname.net\"\
    \n\
    \n/tool fetch url=\"https://api.telegram.org/bot\$botTelegramToken/sendMes\
    sage\?chat_id=\$telegramChatID&text=\$textToSend&parse_mode=\$parseMode&di\
    sable_web_page_preview=\$disablePreview\" keep-result=no\
    \n\
    \n:log warning \"Mensaje enviado a Telegram\"" host=8.8.8.8 http-codes="" \
    interval=30s test-script="" type=icmp up-script=""
add comment="\F0\9F\96\A5\EF\B8\8F PRTG" disabled=no down-script="" host=\
    192.168.20.42 http-codes="" test-script="" type=icmp up-script=""
add disabled=no down-script="" host=192.168.10.102 http-codes="" test-script=\
    "" type=simple up-script=""
add comment="\F0\9F\96\B3 PC IVMS Deybis" disabled=yes down-script="" host=\
    192.168.20.197 http-codes="" test-script="" type=simple up-script=""
add comment="\F0\9F\94\80 R1-S1-CORE" disabled=no down-script="" host=\
    10.0.10.175 test-script="" type=simple up-script=""
add comment="\F0\9F\96\A5\EF\B8\8F UNIFI CONTROLLER" disabled=no down-script=\
    "" host=192.168.20.89 test-script="" type=simple up-script=""
add comment="\F0\9F\96\A5\EF\B8\8F UPTIME KUMA" disabled=no down-script="" \
    host=192.168.20.93 test-script="" type=simple up-script=""
add comment="\F0\9F\96\A5\EF\B8\8F PROXMOX" disabled=no down-script="" host=\
    192.168.20.42 test-script="" type=simple up-script=""
add comment="unifi controller" disabled=no down-script="" host=192.168.20.89 \
    test-script="" type=simple up-script=""
