
# R2lab statistics

## historical note (v0)

this used to be done on a need-by-need basis, with a manual process that ended up being too cumbersome and error-prone.

see https://github.com/fit-r2lab/r2lab-misc/tree/master/usage-statistics-obsolete

for the old code.

## historical note (v1)

in a second iteration, we had a more automated process  
we were using PLCAPI to retrieve the leases information  
however this turned out a poor choice, as deleted slices were removing their leases....

so we had rebuilt the history (see rebuild/ here) but that was truly awkward;
and we had to rely on the 'family' slice tag to map slices to usage families

## current status (v2)

we're now using a new API - dubbed r2lab_api - that has a completely, simpler
and more adapted, new data model.

the good news is this page becomes trivial, while during th v1 step it was here
that we had to mess about with additional data to reconstruct the history of
leases.  
now the reconstructed leases are first-class citizens in the new data model -
complete with slice family and even country information.
