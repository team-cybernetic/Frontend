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

import diamonddeer.mainwindow.post.comment.PostCommentUI;
import java.net.URL;
import java.util.ResourceBundle;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ChoiceBox;
import javafx.scene.control.Hyperlink;
import javafx.scene.control.Label;
import javafx.scene.control.Separator;
import javafx.scene.control.TextField;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.GridPane;

/**
 * FXML Controller class
 *
 * @author Tootoot222
 */
public class PostController implements Initializable {

    private int defaultWidth;
    private int defaultHeight;

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
    private ChoiceBox<?> voteAmountUnitChoiceBox;
    @FXML
    private Label locationLabel;
    @FXML
    private Label titleLabel;
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

    /**
     * Initializes the controller class.
     */
    @Override
    public void initialize(URL url, ResourceBundle rb) {
        this.defaultWidth = (int)Math.round(rootPane.getPrefWidth());
        this.defaultHeight = (int)Math.round(rootPane.getPrefHeight());
    }

    public void setUsername(String username) {
        usernameLabel.setText(username);
        //usernameLabel.setTooltip();
    }

    public void setDateTime(String datetime) {
        dateTimeLabel.setText(datetime);
    }

    public void setSize(String sizeAmount, String sizeUnit) {
        sizeAmountLabel.setText(sizeAmount);
        sizeUnitLabel.setText(sizeUnit);
    }

    public void setValue(String valueAmount, String valueUnit) {
        valueAmountLabel.setText(valueAmount);
        valueUnitLabel.setText(valueUnit);
    }

    public void setLocation(String path) {
        locationLabel.setText(path);
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

    public void setReadMoreVisible(boolean visible) {
        readmoreHyperlink.setManaged(visible);
        readmoreHyperlink.setVisible(visible);
    }

    public void setWidthFactor(int widthFactor) {
        rootPane.setPrefWidth(defaultWidth * widthFactor);
    }

    public void setHeightFactor(int heightFactor) {
        rootPane.setPrefHeight(defaultHeight * heightFactor);
    }

    public String getBody() {
        return (bodyLabel.getText());
    }

    public String getTitle() {
        return (titleLabel.getText());
    }

    public void addComment(PostCommentUI comment) {
        commentsPane.getChildren().add(comment.getLayout());
    }
}
