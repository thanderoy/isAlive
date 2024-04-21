/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Performance = Me.imports.performance;
const PanelMenu = imports.ui.panelMenu
const St = imports.gi.St;   // Icons
const GLib = imports.gi.GLib;   // Commands + Timeouts
const Gio = imports.gi.Gio;
const Main = imports.ui.main;   // GNOME Shell Panel
const Mainloop = imports.mainloop;

const STATUS_UP_ICON = Gio.icon_new_for_string(Me.path + '/icons/status_green_18dp.svg');
const STATUS_DOWN_ICON = Gio.icon_new_for_string(Me.path + '/icons/status_red_18dp.svg');
const decoder = new TextDecoder();

class isAlive {
    constructor() {
        this.timeout = null;
        this.icon = null;
        this._icon = null;

    }

    ping(address) {
        this.command = ['ping', '-c', '1', address];

        let [success, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(null, this.command, null, GLib.SpawnFlags.SEARCH_PATH, null);

        GLib.close(stdin);
        GLib.close(stderr);

        if (!success) {
            this.updateIcon(false);
            return;

        } else {
            this.outIOChannel = GLib.IOChannel.unix_new(stdout);
            let line;
            while ((line = this.outIOChannel.read_line()) !== null) {
                const out_str = line.toString();
                console.log(out_str);

                if (out_str.includes(`1 received`)) {
                    const isAliveStatus = true;
                    this.updateIcon(isAliveStatus);
                    break;
                }
            }
        };
    }

    updateIcon(isAliveStatus) {
        if (isAliveStatus) {
            this._icon.set_gicon(STATUS_UP_ICON);
        } else {
            this._icon.set_gicon(STATUS_DOWN_ICON);
        }
        return true
    };

    enable() {
        log(`[isAlive] Service started`);
        const address = '8.8.8.8';
        const interval = 10;

        this.icon = new PanelMenu.Button(0.0, '', false);

        this._icon = new St.Icon({ gicon: STATUS_DOWN_ICON });
        this.icon.add_child(this._icon);

        Main.panel.addToStatusArea(this.uuid, this.icon, 0, 'right');

        this.timeout = Mainloop.timeout_add_seconds(interval, () => {
            this.ping(address);
            return true
        });
    }

    disable() {
        if (this.timeout) {
            Mainloop.source_remove(this.timeout);
            this.timeout = null;
        }

        if (this.icon) {
            this.icon.destroy();
            this.icon = null;
        }
        log(`[isAlive] Service stopped`);

    }
};


function init() {
    return new isAlive();
}
