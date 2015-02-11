var merge = require('lodash.merge');
var remove = require('lodash.remove')

function mergeArrays(original, additions) {
    if (original.length === 0) return additions;
    if (additions.length === 0) return original;
    var ids = additions.map(function(v) {
       return v && v.id; 
    })
    if (typeof additions[0] === "object") {
        remove(original, function(member) {
            return ids.indexOf(member.id) !== -1;
        });
    }
    return original.concat(additions);
}

var fs = require('fs');

var newer = JSON.parse(fs.readFileSync(process.argv.pop()));
var older = JSON.parse(fs.readFileSync(process.argv.pop()));

var newest = merge(older, newer, function(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return mergeArrays(a, b);
    }
});

process.stdout.write('\n' + JSON.stringify(newest, null, 2));
