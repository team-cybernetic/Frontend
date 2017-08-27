/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package diamonddeer.ui.postcomment;

import javafx.scene.layout.Pane;

/**
 * @author Tootoot222
 */
public class PostCommentUI {
    private Pane layout;
    private PostCommentController controller;

    public PostCommentUI(Pane layout, PostCommentController controller) {
        this.layout = layout;
        this.controller = controller;
    }

    public Pane getLayout() {
        return layout;
    }

    public PostCommentController getController() {
        return controller;
    }
}
