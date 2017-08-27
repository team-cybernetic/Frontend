/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package diamonddeer.ui.postcomment;

import beryloctopus.Post;
import diamonddeer.lib.TimeConverter;
import diamonddeer.ui.mainwindow.MainWindowController;
import diamonddeer.ui.mainwindow.PostViewer;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Hyperlink;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;

import java.net.URL;
import java.util.ResourceBundle;

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
    private PostViewer postViewer;

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
        this.defaultWidth = (int) Math.round(rootPane.getPrefWidth());
        this.defaultHeight = (int) Math.round(rootPane.getPrefHeight());
    }

    public void setMainWindow(MainWindowController mainWindow) {
        this.mainWindow = mainWindow;
    }

    public Post getPost() {
        return (post);
    }

    public void setPost(Post post) {
        this.post = post;
        setTitle(post.getTitle());
        setBody(new String(post.getContent())); //TODO: arbitrary content
        setUsername(post.getAuthor().getUsername());
        setDateTime(TimeConverter.dateTimeFromMillis(post.getTimestampMillis()));
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

    public void setBodyVisible(boolean visible) {
        bodyLabel.setManaged(visible);
        bodyLabel.setVisible(visible);
    }

    public void setWidthFactor(int widthFactor) {
        rootPane.setPrefWidth(defaultWidth * widthFactor);
    }

    /*
    public void setReadMoreVisible(boolean visible) {
        readmoreHyperlink.setManaged(visible);
        readmoreHyperlink.setVisible(visible);
    }
*/

    public void setHeightFactor(int heightFactor) {
        rootPane.setPrefHeight(defaultHeight * heightFactor);
    }

    public String getBody() {
        return (bodyLabel.getText());
    }

    public void setBody(String text) {
        if (text != null) {
            bodyLabel.setText(text);
        } else {
            setBodyVisible(false);
        }
    }

    public void setPostViewer(PostViewer postViewer) {
        this.postViewer = postViewer;
    }

    @FXML
    private void handleTitleLabelAction(ActionEvent event) {
        postViewer.viewPost(post);
    }
}
