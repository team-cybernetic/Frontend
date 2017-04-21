/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package diamonddeer.mainwindow.post.comment;

import beryloctopus.Post;
import diamonddeer.mainwindow.MainWindowController;
import diamonddeer.mainwindow.post.PostController;
import java.net.URL;
import java.util.ResourceBundle;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Hyperlink;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;

/**
 * FXML Controller class
 *
 * @author Tootoot222
 */
public class PostCommentController implements Initializable {

    private int defaultWidth;
    private int defaultHeight;
    private MainWindowController mainWindow;
    private Post post;

    @FXML
    private AnchorPane rootPane;
    @FXML
    private Label usernameLabel;
    @FXML
    private Hyperlink titleLabel;
    @FXML
    private Label bodyLabel;
    @FXML
    private Label dateTimeLabel;

    /**
     * Initializes the controller class.
     */
    @Override
    public void initialize(URL url, ResourceBundle rb) {
        this.defaultWidth = (int)Math.round(rootPane.getPrefWidth());
        this.defaultHeight = (int)Math.round(rootPane.getPrefHeight());
    }

    public void setMainWindow(MainWindowController mainWindow) {
        this.mainWindow = mainWindow;
    }

    public void setPost(Post post) {
        this.post = post;
        //TODO: do all setup here
    }

    public Post getPost() {
        return (post);
    }

    public void setUsername(String username) {
        usernameLabel.setText(username);
    }

    public void setDateTime(String datetime) {
        dateTimeLabel.setText(datetime);
    }

    public void setTitle(String title) {
        titleLabel.setText(title);
    }

    public void setBody(String text) {
        if (text != null) {
            bodyLabel.setText(text);
        } else {
            setBodyVisible(false);
        }
    }

    public void setBodyVisible(boolean visible) {
        bodyLabel.setManaged(visible);
        bodyLabel.setVisible(visible);
    }

    /*
    public void setReadMoreVisible(boolean visible) {
        readmoreHyperlink.setManaged(visible);
        readmoreHyperlink.setVisible(visible);
    }
*/

    public void setWidthFactor(int widthFactor) {
        rootPane.setPrefWidth(defaultWidth * widthFactor);
    }

    public void setHeightFactor(int heightFactor) {
        rootPane.setPrefHeight(defaultHeight * heightFactor);
    }

    public String getBody() {
        return (bodyLabel.getText());
    }

    @FXML
    private void handleTitleLabelAction(ActionEvent event) {
        mainWindow.gotoPost(post);
    }
   
}
