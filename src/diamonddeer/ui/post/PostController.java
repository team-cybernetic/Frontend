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
package diamonddeer.ui.post;

import beryloctopus.Post;
import beryloctopus.ValueSender;
import beryloctopus.exceptions.InsufficientFundsException;
import diamonddeer.lib.ByteUnitConverter;
import diamonddeer.lib.TimeConverter;
import diamonddeer.ui.mainwindow.PostViewer;
import diamonddeer.ui.postcomment.PostCommentController;
import diamonddeer.ui.postcomment.PostCommentLoader;
import diamonddeer.ui.postcomment.PostCommentUI;
import javafx.beans.value.ObservableValue;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.FlowPane;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * FXML Controller class
 *
 * @author Tootoot222
 */
public class PostController implements Initializable {

    private static PostCommentLoader postCommentLoader;
    //@FXML
    //private Label titleLabel;
    @FXML
    public Hyperlink titleHyperLink;
    private int defaultWidth;
    private int defaultHeight;
    private long size;
    private long value;
    private Post post;
    private ValueSender tipSource;
    private PostViewer postViewer;
    @FXML
    private Label usernameLabel;
    @FXML
    private Label dateTimeLabel;
    @FXML
    private Button upvoteButton;
    @FXML
    private TextField voteAmountTextField;
    @FXML
    private Button downvoteButton;
    @FXML
    private Label locationLabel;
    @FXML
    private Hyperlink readmoreHyperlink;
    @FXML
    private Separator commentsSeparator;
    @FXML
    private FlowPane commentsPane;
    @FXML
    private AnchorPane rootPane;
    @FXML
    private Label sizeAmountLabel;
    @FXML
    private Label valueAmountLabel;
    @FXML
    private Label sizeUnitLabel;
    @FXML
    private Label valueUnitLabel;
    @FXML
    private Label bodyLabel;


    public static void setPostCommentLoader(PostCommentLoader postCommentLoader) {
        PostController.postCommentLoader = postCommentLoader;
    }

    /**
     * Initializes the controller class.
     */
    @Override
    public void initialize(URL url, ResourceBundle rb) {
        this.defaultWidth = (int) Math.round(rootPane.getPrefWidth());
        this.defaultHeight = (int) Math.round(rootPane.getPrefHeight());
        // TODO
        voteAmountTextField.textProperty().addListener((ObservableValue
                                                                <? extends String> observable, String oldValue, String newValue)
                -> {
            if (!newValue.matches("\\-?\\d*") || newValue.length() > 8) {
                if (newValue.length() > 8) {
                    newValue = newValue.substring(0, 8);
                }
                if (newValue.charAt(0) == '-') {
                    newValue = '-' + newValue.replaceAll("[^(\\d)]", "");
                } else {
                    newValue = newValue.replaceAll("[^(\\d)]", "");
                }
            }
            voteAmountTextField.setText(newValue);
        });
    }

    public void setTipSource(ValueSender valueSender) {
        this.tipSource = valueSender;
    }

    public Post getPost() {
        return (post);
    }

    public void setPost(Post post) throws IOException {
        this.post = post;
        setUsername(post.getAuthor().getUsername());
        setDateTime(TimeConverter.dateTimeFromMillis(post.getTimestampMillis()));
        setSize(post.getByteSize());
        setValue(post.getValue());
        setLocation(post.getParentFullPath());
        setTitle(post.getTitle());

        //TODO: arbitrary javafx elements as body (html, video, etc)
        setBody(new String(post.getContent()));

        //TODO: sort comments by feed settings
        for (Post childPost : post.getSubposts()) {
            PostCommentUI comment = postCommentLoader.loadEmptyPostComment();
            PostCommentController commentController = comment.getController();
            commentController.setPost(childPost);
            commentController.setPostViewer(postViewer);
            addComment(comment);
        }
    }

    public void setUsername(String username) {
        usernameLabel.setText(username);
        //usernameLabel.setTooltip();
    }

    public void setDateTime(String datetime) {
        dateTimeLabel.setText(datetime);
    }

    public void setSize(long bytes) {
        String[] sizeString = ByteUnitConverter.bytesToUnitSplit(bytes);
        sizeAmountLabel.setText(sizeString[0]);
        sizeUnitLabel.setText(sizeString[1]);
    }

    public void setValue(long bytes) {
        String[] sizeString = ByteUnitConverter.bytesToUnitSplit(bytes);
        valueAmountLabel.setText(sizeString[0]);
        valueUnitLabel.setText(sizeString[1]);
    }

    public void setLocation(String path) {
        if (path != null) {
            locationLabel.setText(path);
            setLocationVisible(true);
        } else {
            setLocationVisible(false);
        }
    }

    public void setTitle(String title) {
        //titleLabel.setText(title);
        titleHyperLink.setText(title);
    }

    public void setBody(String text) {
        if (text != null) {
            bodyLabel.setText(text);
        } else {
            setBodyVisible(false);
        }
    }

    public void setLocationVisible(boolean visible) {
        locationLabel.setManaged(visible);
        locationLabel.setVisible(visible);
    }

    public void setBodyVisible(boolean visible) {
        bodyLabel.setManaged(visible);
        bodyLabel.setVisible(visible);
    }

    public void setReadMoreVisible(boolean visible) {
        readmoreHyperlink.setManaged(visible);
        readmoreHyperlink.setVisible(visible);
    }

    public void setTitleVisible(boolean visible) {
        titleHyperLink.setManaged(visible);
        titleHyperLink.setVisible(visible);
    }

    public void setWidthFactor(int widthFactor) {
        rootPane.setPrefWidth(defaultWidth * widthFactor);
    }

    public void setHeightFactor(int heightFactor) {
        rootPane.setPrefHeight(defaultHeight * heightFactor);
    }

    public void addComment(PostCommentUI comment) {
        commentsPane.getChildren().add(comment.getLayout());
    }

    public void setPostViewer(PostViewer postViewer) {
        this.postViewer = postViewer;
    }

    @FXML
    private void handleTipButtonAction() {
        long tipAmount = 0;
        if (voteAmountTextField.getText().equals("")
                || voteAmountTextField.getText().equals("-")) {
            //TODO: warn the user of invalid input
            return;
        }
        try {
            tipAmount = Long.valueOf(voteAmountTextField.getText());
        } catch (NumberFormatException ex) {
            //TODO: warn invalid input
            return;
        }
        if (tipAmount == 0) {
            //TODO: warn that tipping 0 doesn't mean anything
            return;
        }

        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Tip");
        String valueStr = ByteUnitConverter.bytesToUnit(tipAmount);
        alert.setHeaderText("Are you sure you want to tip " + valueStr + " to \"" + post.getTitle() + "\"?");
        //alert.setContentText("");
        alert.showAndWait();

        if (alert.getResult() == ButtonType.OK) {
            /*
            mainWindow.changeEarnings(-1 * Math.abs(tipAmount));
            mainWindow.tipPost(post, tipAmount);
            */
            voteAmountTextField.setText("");
            try {
                tipSource.sendValue(post, tipAmount);
                setValue(post.getValue());
            } catch (InsufficientFundsException ex) {
                Alert noFunds = new Alert(Alert.AlertType.ERROR);
                noFunds.setTitle("Insufficient funds!");
                noFunds.setHeaderText("You don't have enough value earned to send " + valueStr + "!");
                noFunds.showAndWait();
            }
        }
    }

    @FXML
    private void handleUpvoteButtonAction() {
        int tipAmount = 0;
        if (!voteAmountTextField.getText().equals("")
                && !voteAmountTextField.getText().equals("-")) {
            tipAmount = Integer.valueOf(voteAmountTextField.getText());
        }
        tipAmount += post.getByteSize();
        voteAmountTextField.setText(String.valueOf(tipAmount));
    }

    @FXML
    private void handleDownvoteButtonAction() {
        int tipAmount = 0;
        if (!voteAmountTextField.getText().equals("")
                && !voteAmountTextField.getText().equals("-")) {
            tipAmount = Integer.valueOf(voteAmountTextField.getText());
        }
        tipAmount -= post.getByteSize();
        voteAmountTextField.setText(String.valueOf(tipAmount));
    }

    @FXML
    private void handleGotoPostAction(ActionEvent event) {
        postViewer.viewPost(post);
    }

    
    /*
    public String getLocation() {
        return locationLabel.getText();
    }
   
    public String getTitle() {
        return titleHyperLink.getText();
    }

    public String getBody() {
        return bodyLabel.getText();
    }

    public String getUsername() {
        return usernameLabel.getText();
    }

    public String getDateTime() {
        return dateTimeLabel.getText();
    }

    public long getSize() {
        return (size);
    }

    public long getValue() {
        return (value);
    }
    */
}
