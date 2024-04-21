/**
 * PERFORMANCE MEASUREMENT Library for GNOME Shell Extensions
 * 
 * LICENSE:
 * 
 *   Copyright 2022 Javad Rahmatzadeh
 * 
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * DEPENDENCY:
 *
 *   libgtop2
 *
 *   Ubuntu: sudo apt install libgtop2-dev
 *   Fedora: sudo dnf install libgtop2-devel
 *
 * HOW TO USE:
 *
 *   Import this file to your GNOME Shell Extension project (For example,
 *   import it as Performance). Then use this in start and end of the block you
 *   want to measure:
 *
 *   Performance.start('Test1');
 *   // code to measure
 *   Performance.end();
 *
 *   You can also use it in nested blocks:
 *
 *   Performance.start('Test1');
 *   // code lines to measure for Test1
 *     Performance.start('Test2');
 *     // code lines to measure for Test2
 *     Performance.end(); 
 *   // code lines to measure for Test1
 *   Performance.end();
 *
 *   Now if you go to the gnome-shell log, you can see the performance result.
 *
 *   To view GNOME Shell log:
 *
 *   journalctl -fo cat /usr/bin/gnome-shell
 *   or
 *   journalctl -fo cat /usr/bin/gjs
 *   or
 *   journalctl -f
 * 
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2022
 * @license    GPL version 3
 */

const {GLib, GTop} = imports.gi;
const Me = imports.misc.extensionUtils.getCurrentExtension();

/**
 * timing for each block
 * 
 * @var object
 *   property name is string of id,
 *   value is int of time in microseconds
 */
let timing = {};

/**
 * block ids in queue
 * 
 * @var array
 *   value is string of id
 */
let ids = [];

/**
 * memory reference
 * 
 * @var object
 */
let mem = new GTop.glibtop_mem();

/**
 * memory usage in bytes
 * the order should be the same as ids and it will indicate to the id name
 * 
 * @var array
 *   value is int of bytes
 */
let memUsageOnStart = [];

/**
 * starts the block measurement
 *
 * @param string id unique name for the block
 * 
 * @return void
 */
function start (id) {
    if (id in timing) {
        throw new Error("the block id has been already started");
    } else if (typeof id !== 'string') {
        throw new Error("id should be string");
    } else if (id.length < 1) {
        throw new Error("pick a proper name for id");
    } else {
        timing[id] = GLib.get_monotonic_time();
        ids.push(id);
        memUsageOnStart.push(currentUsedMemory());
    }
}

/**
 * ends the block measurement
 * 
 * @return void
 */
function end () {
    if (ids.length < 1) {
        throw new Error("Nothing has been queued!");
    }
    let id = ids.pop();
    let microsec = GLib.get_monotonic_time() - timing[id];
    let millisec = microsec / 1000;
    let memoryBytes = currentUsedMemory() - memUsageOnStart.pop();
    delete timing[id];
    let logArr = [];
    logArr.push('------------------------------------------');
    logArr.push('PERFORMANCE MEASUREMENT');
    logArr.push('------------------------------------------');
    logArr.push('Extension Name: ' + Me.metadata.name);
    logArr.push('Block ID: ' + id);
    logArr.push('Microseconds: ' + microsec);
    logArr.push('Milliseconds: ' + millisec);
    logArr.push('Memory Usage: ' + friendlyBytes(memoryBytes));
    log(logArr.join("\n"));
}

/**
 * get the memory that is currently used
 *
 * @return int bytes
 */
function currentUsedMemory () {
    GTop.glibtop_get_mem(mem);
    return mem.used;
}

/**
 * convert bytes to KB, MB, ...
 *
 * @param int bytes
 *
 * @return string
 */
function friendlyBytes (bytes) {
    if (bytes === 0) return '0 Bytes';
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let kilo = 1000;
    let step = Math.floor(Math.log(bytes) / Math.log(kilo));
    let number = parseFloat((bytes / Math.pow(kilo, step)).toFixed(2));
    return number + ' ' + sizes[step];
}
