#
# StromDAO Business Object - Decentralized Apps
# Deployment via Makefile to automate general Quick Forward 
#

PROJECT = "STROMDAO Website"


all:  commit

commit: ;git add -A && git commit -a && git push && git push origin master;
