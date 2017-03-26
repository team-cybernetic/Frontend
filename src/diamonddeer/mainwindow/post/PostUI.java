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
package diamonddeer.mainwindow.post;

import javafx.scene.layout.Pane;

/**
 *
 * @author Tootoot222
 */
public class PostUI {
    private Pane layout;
    private PostController controller;

    public PostUI(Pane layout, PostController controller) {
        this.layout = layout;
        this.controller = controller;
    }

    public Pane getLayout() {
        return layout;
    }

    public PostController getController() {
        return controller;
    }

    
    
}
