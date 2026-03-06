title: About X and vnc sessions
tab: tutorial
skip_header: True

<script src="/assets/r2lab/open-tab.js"></script>

<div class="container" markdown="1">

<< tuto_tabs "X11 SESSIONS":X11SESSIONS "VNC SESSIONS":VNCSESSIONS >>

<div id="contents" class="tab-content" markdown="1">

<!-- ------- TAB1 ------------>
<div id="VNCSESSIONS" class="tab-pane fade" markdown="1">

# VNC sessions

if your laptop runs a VNC client, that's the easy way to run interactive tools on faraday

## on faraday

`faraday` runs a vnc server, and here is how to create a VNC tunnel

**example** from a MAC:

* ```
  ssh -L localhost:5901:vnc-your_slicename:5900 your_slicename@faraday.inria.fr
  ```
* while this is running I can use e.g. the `VNC Viewer` app on the MAC  
  and connect to `localhost:1`, in order to get an interactive X11 session on faraday
* using port e.g. 5902 instead of 5901 means I need to connect to `localhost:2`


**other OS'es**:

* significantly easier from a linux box  

  ```
  vncviewer -shared -via your_slicename@faraday.inria.fr vnc-your_slicename
  ```
* see detailed instructions for other OS'es here (on faraday itself):

  ```
  less /usr/share/doc/vncserver-sop/README.txt
  ```
  where you replace `SERVER` with `faraday.inria.fr` and `LOGIN` with `your_slicename`

</div>

<!-- ------- TAB2 ------------>
<div id="X11SESSIONS" class="tab-pane fade show active" markdown="1">

# X11 sessions

if your laptop already runs an X server, you can create an X11 tunnel using either of openssh's native `-X` or `-Y` options

## on faraday

```
ssh -Y your_slicename@faraday.inria.fr
firefox &
```

## on a node

providided that the node OS has the X clients installed

```
ssh -Y your_slicename@faraday.inria.fr ssh -Y root@fit01
xterm &
```

</div>

</div> <!-- end div contents -->

</div> <!-- end div container -->
