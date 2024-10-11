
# R2lab statistics

## historical note

this used to be done on a need-by-need basis, with a manual process that ended up being too cumbersome and error-prone.

see https://github.com/fit-r2lab/r2lab-misc/tree/master/usage-statistics-obsolete

for the old code.

## accounts information

we now rely on a 'family' tag set on each newly created slice  
this can be set through the plewww interface (i.e. r2labapi.inria.fr)

## old leases

somehow we have some leases that are no longer accounted for in the database, although there are Log events that demonstrate they have been created

a period of particular interest is the one that goes from 2023-02-08 and 2023-02-13

> Comme je te disais, j ai l impression qu on ne voit qu'une partie des resas. Par exemple, je ne vois pas dans les stats les resas du slice inria_hive. Je sais qu il devait y en avoir pas mal par exemple entre le 8 et le 13 fevrier 2023. C est bizarre...

and indeed for example there are events that suggest that this really happened

> 12933,faraday.inria.fr,inria_hive,2023-02-08 12:30:00,2023-02-08 13:10:00.000

so for this reason there is a - admittedly complex - code in rebuild/ here that allowed to rebuild a consolidated view of the leases that have been active in the past

xxx to be continued
