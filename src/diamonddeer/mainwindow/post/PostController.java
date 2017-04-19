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

import diamonddeer.mainwindow.MainWindowController;
import javafx.beans.value.ObservableValue;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.GridPane;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

/**
 * FXML Controller class
 *
 * @author Tootoot222
 */
public class PostController implements Initializable {

    private int defaultWidth;
    private int defaultHeight;
    private MainWindowController mainWindow;

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
    //@FXML
    //private Label titleLabel;
    @FXML
    public Hyperlink gotoPost;
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
    private String value;


    /**
     * Initializes the controller class.
     */
    @Override
    public void initialize(URL url, ResourceBundle rb) {
        this.defaultWidth = (int)Math.round(rootPane.getPrefWidth());
        this.defaultHeight = (int)Math.round(rootPane.getPrefHeight());
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

    public void setMainWindow(MainWindowController mainWindow) {
        this.mainWindow = mainWindow;
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
    
    public String getLocation() {
        return locationLabel.getText();
    }

    public void setTitle(String title) {
        //titleLabel.setText(title);
        gotoPost.setText(title);
    }
    
    public String getTitle() {
        return gotoPost.getText();
    }

    public void setBody(String text) {
        if (text != null) {
            bodyLabel.setText(text);
        } else {
            setBodyVisible(false);
        }
    }
    public String getBody() {
        return bodyLabel.getText();
    }

    public void setBodyVisible(boolean visible) {
        bodyLabel.setManaged(visible);
        bodyLabel.setVisible(visible);
    }

    public void setReadMoreVisible(boolean visible) {
        readmoreHyperlink.setManaged(visible);
        readmoreHyperlink.setVisible(visible);
    }

    public void setGoToPostVisible(boolean visible) {
        gotoPost.setManaged(visible);
        gotoPost.setVisible(visible);
    }

    public String getUsername() {
        return usernameLabel.getText();
    }

    public String getDateTime() {
        return dateTimeLabel.getText();
    }

    public String getSize() {
        return sizeAmountLabel.getText() + " " + sizeUnitLabel.getText();
    }

    public String getValue() {
        return valueAmountLabel.getText() + " " + valueUnitLabel.getText();
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

    @FXML
    private void handleTipButtonAction() {
        int tipAmount = 0;
        if (!voteAmountTextField.getText().equals("")
                && !voteAmountTextField.getText().equals("-")) {
            tipAmount = Integer.valueOf(voteAmountTextField.getText());
        }

        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Tip");
        alert.setHeaderText("Are you sure you want to tip " + tipAmount + " Kb?");
        //alert.setContentText("");
        alert.showAndWait();

        if (alert.getResult() == ButtonType.OK) {
            mainWindow.changeEarnings(-1 * Math.abs(tipAmount));
            voteAmountTextField.setText("");
        }
    }

    @FXML
    private void handleUpvoteButtonAction() {
        int tipAmount = 0;
        if (!voteAmountTextField.getText().equals("")
                && !voteAmountTextField.getText().equals("-")) {
            tipAmount = Integer.valueOf(voteAmountTextField.getText());
        }
        tipAmount += 100;
        voteAmountTextField.setText(String.valueOf(tipAmount));
    }

    @FXML
    private void handleDownvoteButtonAction() {
        int tipAmount = 0;
        if (!voteAmountTextField.getText().equals("")
                && !voteAmountTextField.getText().equals("-")) {
            tipAmount = Integer.valueOf(voteAmountTextField.getText());
        }
        tipAmount -= 100;
        voteAmountTextField.setText(String.valueOf(tipAmount));
    }
}
