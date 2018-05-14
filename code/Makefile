SLICE  = inria_r2lab.tutorial
GW     = faraday.inria.fr
NODES  = 1-2
ASSETS = ../assets/code


all::
clean::
.PHONY: all clean


# this is because the tutos start with the assumption
# that nodes have been loaded and all
prepare:
	ssh $(SLICE)@$(GW) rhubarbe bye -a ~$(NODES)
	ssh $(SLICE)@$(GW) rhubarbe load $(NODES)
	ssh $(SLICE)@$(GW) rhubarbe wait $(NODES)
.PHONY: prepare


# script_target short long category options

define script_target_no_dot
$(ASSETS)/$(1).out: $(2).py
	python3 -u $(2).py $(4) >& $(ASSETS)/$(1).out || rm $(ASSETS)/$(1).out

$(1): $(ASSETS)/$(1).out
$(1).clean:
	rm -f $(ASSETS)/$(1).out
$(3):: $(1)
.PHONY: $(3) $(1) $(1).clean

all:: $(1)
clean::
	rm -f $(ASSETS)/$(1).out $(ASSETS)/$(1).png
endef

define script_target
$(ASSETS)/$(1).out $(ASSETS)/$(1).png: $(2).py
	python3 -u $(2).py $(4) >& $(ASSETS)/$(1).out || rm $(ASSETS)/$(1).out
	dot -Tpng -o $(ASSETS)/$(1).png $(1).dot

$(1): $(ASSETS)/$(1).out
$(1).clean:
	rm -f $(ASSETS)/$(1).out $(ASSETS)/$(1).png
$(3):: $(1)
.PHONY: $(3) $(1) $(1).clean

all:: $(1)
clean::
	rm -f $(ASSETS)/$(1).out $(ASSETS)/$(1).png
endef

$(eval $(call script_target_no_dot,A1,A1-ping,A,))
$(eval $(call script_target_no_dot,A2,A2-ping,A,-s $(SLICE)))
$(eval $(call script_target_no_dot,A3,A3-ping,A,-v))
$(eval $(call script_target,A4,A4-ping,A,))
$(eval $(call script_target,A5,A5-ping,A,))
$(eval $(call script_target,B1,B1-wireless,B,))
$(eval $(call script_target,B2,B2-wireless,B,))
$(eval $(call script_target,B3,B3-wireless,B,))
$(eval $(call script_target,B4,B4-wireless,B,))
$(eval $(call script_target,C1,C1-files,C,))
$(eval $(call script_target,C2,C2-files,C,))
$(eval $(call script_target,C3,C3-files,C,))
$(eval $(call script_target,C3bis,C3bis-files,C,))
$(eval $(call script_target,D1,D1-prep,D,-l))
$(eval $(call script_target,D2,D2-prep,D,-l))
$(eval $(call script_target,D3,D3-prep,D,--load --node-a 10 --node-b 20))
