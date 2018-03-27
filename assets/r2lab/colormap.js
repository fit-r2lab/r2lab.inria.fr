// colors are strings
// like e.g.
//  "rgba(152, 193, 217, 0.5)",
// or
//  "#00E0DF80",

let ColorMap = function(index_max) {

    this.index_max = index_max;
    this.hash = new Map();


    // mechanism to keep track of the actual
    // number of different colors
    this.init = function() {
        this.colors = new Set();
    }

    this.set =  function(index, color) {
        this.hash.set(index, color);
        this.colors.add(color);
    }


    // generate colormap from a list of colours
    this.cyclic = function(group_colors, width) {
        if (width === undefined) {
            width = group_colors.length;
        }
        this.init();
        for (let i = 1; i <= this.index_max; i++) {
             this.set(i, group_colors[i % width])
        }
        return this;
    }

    // fill from
    // * a list of colours
    // * a partition of indices like e.g.
    //  [
    //    [1, 4, 10, 15],
    //    [2, 5, 11, 19],
    //    [...]
    //  ]
    this.handpick = function(group_colors, partitions) {
        this.init();
        for (let part_index = 0;
             part_index < partitions.length;
              part_index++) {
            let partition = partitions[part_index];
            for (let node_id of partition) {
                this.set(node_id, group_colors[part_index]);
            }
        }
        for (let node_id = 1; node_id <= this.index_max; node_id++) {
            if (! this.hash.get(node_id)) {
                console.log(`Warning - node ${node_id} has no color`)
            }
        }
        return this;
    }

    this.color = function(index) {
        return this.hash.get(index);
    }

    // hardwire some ways to group the nodes
    this.groups5 = {
        1: 0,
    }

    this.hostname = function(node_id) {
        return "fit" + node_id.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});

    }

    this.colortable = function() {
        let columns = this.colors.size;
        let div = $(`div#colortable_container`);
        div
          .append(`<h1>details of the ${columns} groups</h1>`)
          .append(`<table><thead><tr><th>Group #</th><th>Nodes</th></thead>`
              + `<tbody></tbody></table>`)
        ;
        let group_number = 0;
        for (let color of this.colors.keys()) {
            group_number += 1;
            let tr = $(`<tr>`)
                .css(`background-color`, color)
                .append(
                    $(`<th>Group ${group_number}</th>`)
                    .css(`background-color`, color));
            let column = "";
            for (let node_id = 1; node_id <= this.index_max; node_id ++) {
                if (this.color(node_id) == color) {
                    column += ` ${this.hostname(node_id)}`;
                }
            }
            tr.append(`<td><code>${column}</code></td>`);
            $(`div#colortable_container tbody`).append(tr);
        }
    }
}
