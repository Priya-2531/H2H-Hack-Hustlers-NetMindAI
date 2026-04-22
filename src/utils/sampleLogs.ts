export const SAMPLE_SYSLOG = `<34>Oct 11 22:14:15 router1 sshd[1234]: Failed password for root from 192.168.1.105 port 52022 ssh2
<34>Oct 11 22:14:16 router1 sshd[1234]: Failed password for root from 192.168.1.105 port 52023 ssh2
<34>Oct 11 22:14:17 router1 sshd[1234]: Failed password for root from 192.168.1.105 port 52024 ssh2
<34>Oct 11 22:14:18 router1 sshd[1234]: Failed password for root from 192.168.1.105 port 52025 ssh2
<34>Oct 11 22:14:19 router1 sshd[1234]: Failed password for root from 192.168.1.105 port 52026 ssh2
<165>Oct 11 22:14:22 fw-edge iptables[892]: DROP IN=eth0 OUT= SRC=203.0.113.45 DST=10.0.0.1 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=12345 DF PROTO=TCP SPT=51234 DPT=22 WINDOW=65535 RES=0x00 SYN URGP=0
<13>Oct 11 22:15:00 app-server nginx[3306]: 10.0.0.45 - - [11/Oct/2024:22:15:00 +0000] "GET /admin HTTP/1.1" 404 572 "-" "sqlmap/1.7.2"
<38>Oct 11 22:15:03 db-primary kernel: Out of memory: Kill process 5234 (postgres) score 900 or sacrifice child
<86>Oct 11 22:15:10 switch-core ospfd[445]: OSPF neighbor 10.1.0.2 in state Exstart changed to Down
<14>Oct 11 22:15:15 fw-edge sudo[2048]: pam_unix(sudo:auth): authentication failure; logname=admin uid=1000 euid=0 tty=/dev/pts/0 ruser=admin rhost=  user=admin
<38>Oct 11 22:15:20 app-server kernel: eth0: Link is Down
<30>Oct 11 22:15:30 router1 dhcpd[789]: DHCPDISCOVER from 00:0c:29:aa:bb:cc via eth1
<46>Oct 11 22:15:45 app-server cron[902]: (root) CMD (/usr/bin/backup.sh)
<165>Oct 11 22:16:00 fw-edge iptables[892]: DROP IN=eth0 OUT= SRC=198.51.100.77 DST=10.0.0.1 PROTO=TCP DPT=3389 SYN
<165>Oct 11 22:16:05 fw-edge iptables[892]: DROP IN=eth0 OUT= SRC=198.51.100.77 DST=10.0.0.1 PROTO=TCP DPT=445 SYN
<165>Oct 11 22:16:10 fw-edge iptables[892]: DROP IN=eth0 OUT= SRC=198.51.100.77 DST=10.0.0.1 PROTO=TCP DPT=135 SYN
<165>Oct 11 22:16:15 fw-edge iptables[892]: DROP IN=eth0 OUT= SRC=198.51.100.77 DST=10.0.0.1 PROTO=TCP DPT=1433 SYN
<165>Oct 11 22:16:20 fw-edge iptables[892]: DROP IN=eth0 OUT= SRC=198.51.100.77 DST=10.0.0.1 PROTO=TCP DPT=3306 SYN
<165>Oct 11 22:16:25 fw-edge iptables[892]: DROP IN=eth0 OUT= SRC=198.51.100.77 DST=10.0.0.1 PROTO=TCP DPT=27017 SYN
<30>Oct 11 22:16:40 router1 named[500]: DNS query rate exceeded: 5000 queries/sec from 172.16.0.45
<22>Oct 11 22:17:00 core-switch bgpd[301]: BGP peer 10.0.0.254 Down - Hold Timer Expired`;

export const SAMPLE_SNMP = `2024-10-11 22:14:00 SNMP Trap received from Agent: 192.168.10.5 Enterprise: 1.3.6.1.4.1.9.9.43 OID: 1.3.6.1.6.3.1.1.5.3 Trap-Type: linkDown Value: ifIndex=2 ifDescr=GigabitEthernet0/1 ifAdminStatus=up ifOperStatus=down
2024-10-11 22:14:05 SNMP Trap received from Agent: 192.168.10.5 Enterprise: 1.3.6.1.4.1.9.9.43 OID: 1.3.6.1.6.3.1.1.5.4 Trap-Type: linkDown Value: Interface GigabitEthernet0/2 is now down - critical
2024-10-11 22:14:10 SNMP Trap received from Agent: 192.168.10.10 Enterprise: 1.3.6.1.4.1.9 OID: 1.3.6.1.4.1.9.9.187.0.0.1 Trap-Type: bgpEstablished Value: BGP peer 10.0.0.254 session established
2024-10-11 22:14:30 SNMP Trap received from Agent: 192.168.10.15 Enterprise: 1.3.6.1.4.1.9.9.109 OID: 1.3.6.1.4.1.9.9.109.1.1.1 Trap-Type: cpuThreshold Value: CPU utilization exceeded 95% threshold - critical warning alert
2024-10-11 22:14:45 SNMP Trap received from Agent: 192.168.10.20 Enterprise: 1.3.6.1.4.1.9.9.48 OID: 1.3.6.1.4.1.9.9.48.1.1 Trap-Type: memoryWarning Value: Memory utilization at 88% warn threshold exceeded
2024-10-11 22:15:00 SNMP Trap received from Agent: 192.168.10.5 Enterprise: 1.3.6.1.4.1.9.9.43 OID: 1.3.6.1.6.3.1.1.5.5 Trap-Type: coldStart Value: Device rebooted unexpectedly - critical error
2024-10-11 22:15:15 SNMP Trap received from Agent: 192.168.10.25 Enterprise: 1.3.6.1.4.1.9.9.176 OID: 1.3.6.1.4.1.9.9.176.1.1 Trap-Type: ospfNbrStateChange Value: OSPF neighbor 10.1.0.2 changed state from Full to Down
2024-10-11 22:15:30 SNMP Trap received from Agent: 192.168.10.30 Enterprise: 1.3.6.1.4.1.9 OID: 1.3.6.1.2.1.2.2.1 Trap-Type: interfaceError Value: Excessive CRC errors on Ethernet port Gi0/3 - error fail
2024-10-11 22:15:45 SNMP Trap received from Agent: 192.168.10.35 Enterprise: 1.3.6.1.4.1.9.9.48 OID: 1.3.6.1.4.1.9.9.48.1 Trap-Type: fanFailure Value: Fan module 2 failure detected - critical alert
2024-10-11 22:16:00 SNMP Trap received from Agent: 192.168.10.40 Enterprise: 1.3.6.1.4.1.9 OID: 1.3.6.1.4.1.9.9.13.1 Trap-Type: temperatureAlert Value: Chassis temperature 85C exceeds warn threshold of 75C
2024-10-11 22:16:15 SNMP Trap received from Agent: 192.168.10.5 Enterprise: 1.3.6.1.4.1.9.9.43 OID: 1.3.6.1.6.3.1.1.5.3 Trap-Type: linkUp Value: Interface GigabitEthernet0/1 is back up`;

export const SAMPLE_VPC = `version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status
2 123456789012 eni-0a1b2c3d 192.168.1.105 10.0.0.5 52022 22 6 4 240 1697062455 1697062515 REJECT OK
2 123456789012 eni-0a1b2c3d 192.168.1.105 10.0.0.5 52023 22 6 4 240 1697062456 1697062516 REJECT OK
2 123456789012 eni-0a1b2c3d 192.168.1.105 10.0.0.5 52024 22 6 4 240 1697062457 1697062517 REJECT OK
2 123456789012 eni-0b2c3d4e 203.0.113.45 10.0.0.10 80 3389 6 8 480 1697062460 1697062520 REJECT OK
2 123456789012 eni-0b2c3d4e 198.51.100.77 10.0.0.10 5555 445 6 12 720 1697062465 1697062525 REJECT OK
2 123456789012 eni-0c3d4e5f 10.0.0.20 10.0.0.30 54321 443 6 100 150000 1697062470 1697062530 ACCEPT OK
2 123456789012 eni-0d4e5f6g 172.16.0.45 10.0.0.50 1024 53 17 500 30000 1697062475 1697062535 ACCEPT OK
2 123456789012 eni-0e5f6g7h 10.0.0.100 8.8.8.8 45678 80 6 200 1200000 1697062480 1697062540 ACCEPT OK
2 123456789012 eni-0f6g7h8i 45.33.32.156 10.0.0.5 0 0 1 1000 80000 1697062485 1697062545 REJECT OK
2 123456789012 eni-0a1b2c3d 10.0.0.200 10.0.0.5 9999 27017 6 50 3200000 1697062490 1697062550 ACCEPT OK
2 123456789012 eni-0b2c3d4e 192.168.2.50 10.0.0.30 1025 80 6 1500 900000 1697062495 1697062555 ACCEPT OK
2 123456789012 eni-0c3d4e5f 198.51.100.88 10.0.0.40 2048 3306 6 20 1200 1697062500 1697062560 REJECT OK
2 123456789012 eni-0d4e5f6g 10.0.0.150 10.0.0.60 8080 443 6 300 15000000 1697062505 1697062565 ACCEPT OK
2 123456789012 eni-0e5f6g7h 91.121.0.1 10.0.0.70 4444 4444 6 5 300 1697062510 1697062570 REJECT OK`;
