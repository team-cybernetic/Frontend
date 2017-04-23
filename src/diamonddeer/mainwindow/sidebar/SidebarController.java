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

import beryloctopus.Post;
import diamonddeer.lib.ByteUnitConverter;
import diamonddeer.lib.TimeConverter;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.layout.AnchorPane;

import java.net.URL;
import java.util.ResourceBundle;
import javafx.event.ActionEvent;

/**
 * FXML Controller class
 *
 * @author Tootoot222
 */
public class SidebarController implements Initializable {

    private Post post;

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
    @FXML
    private Label titleLabel;
    @FXML
    private TitledPane RulesetTitledPane;
    @FXML
    private TitledPane UsersTitledPane;
    @FXML
    private TitledPane ContentTypeTitledPane;
    

    /**
     * Initializes the controller class.
     */
    @Override
    public void initialize(URL url, ResourceBundle rb) {
        // TODO
    }

    public void setPost(Post post) {
        this.post = post;
        setTitle(post.getTitle());
        setBody(new String(post.getContent())); //TODO: arbitrary content

        setUsername(post.getAuthor().getUsername());
        setDateTime(TimeConverter.dateTimeFromMillis(post.getTimestampMillis()));
        setSize(post.getByteSize());
        setValue(post.getValue());
        setTitle(post.getTitle());
        //setContentType(post.getContentType());

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

    public void setTitle(String title) {
        titleLabel.setText(title + "/");
    }
    
    public String getTitle() {
        return titleLabel.getText();
    }

    public void setBody(String text) {
        if (text != null) {
            bodyLabel.setText(text);
            setBodyVisible(true);
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

    @FXML
    private void handleUpvoteButtonAction(ActionEvent event) {
    }

    @FXML
    private void handleTipButtonAction(ActionEvent event) {
    }

    @FXML
    private void handleDownvoteButtonAction(ActionEvent event) {
    }
}
