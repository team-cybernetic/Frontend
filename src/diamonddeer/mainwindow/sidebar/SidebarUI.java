/* 
 * Copyright (C) 2017 Tootoot222
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package diamonddeer.mainwindow.sidebar;

import javafx.scene.layout.AnchorPane;

/**
 * @author Tootoot222
 */
public class SidebarUI {
    private AnchorPane layout;
    private SidebarController controller;

    public SidebarUI(AnchorPane layout, SidebarController controller) {
        this.layout = layout;
        this.controller = controller;
    }

    public AnchorPane getLayout() {
        return layout;
    }

    public SidebarController getController() {
        return controller;
    }
}
