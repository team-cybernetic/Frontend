/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package diamonddeer.mainwindow.editor;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.StackPane;
import javafx.scene.web.HTMLEditor;

import java.net.URL;
import java.util.ResourceBundle;

/**
 * FXML Controller class
 *
 * @author Tootoot222
 */
public class EditorController implements Initializable {

    private boolean showingHTMLEditor = true;
    private boolean showingPlaintextEditor = false;

    @FXML
    private ToggleGroup editorType;
    @FXML
    private AnchorPane rootPane;
    @FXML
    private TextField titleTextField;
    @FXML
    private TextField tagsTextField;
    @FXML
    private Button tagsAddButton;
    @FXML
    private Button mediaAddButton;
    @FXML
    private ImageView mediaImageView;
    @FXML
    private HTMLEditor contentHTMLEditor;
    @FXML
    private CheckBox postSettingsPrivateCheckBox;
    @FXML
    private CheckBox postSettingsForbidRepliesCheckBox;
    @FXML
    private CheckBox postSettingsForbidSharingCheckBox;
    @FXML
    private ComboBox<String> postSettingsContentTypeComboBox;
    @FXML
    private RadioButton editorSettingsHTMLEditorRadioButton;
    @FXML
    private RadioButton editorSettingsPlaintextEditorRadioButton;
    @FXML
    private TextArea contentTextArea;
    @FXML
    private StackPane contentStackPane;

    /**
     * Initializes the controller class.
     */
    @Override
    public void initialize(URL url, ResourceBundle rb) {
        editorSettingsHTMLEditorRadioButton.setToggleGroup(editorType);
        editorSettingsPlaintextEditorRadioButton.setToggleGroup(editorType);
        ObservableList<String> postTypeList = FXCollections.observableArrayList(
                "Text Post", "User Profile Post");
        postSettingsContentTypeComboBox.setItems(postTypeList);
        postSettingsContentTypeComboBox.getSelectionModel().selectFirst();
    }

    public String getContentType() {
        return postSettingsContentTypeComboBox.getSelectionModel()
                .getSelectedItem().toString();
    }

    @FXML
    private void handleTagsAddButtonAction(ActionEvent event) {
    }

    @FXML
    private void handleMediaAddButtonAction(ActionEvent event) {
    }

    private void contentShowPlaintextEditor() {
        showingHTMLEditor = false;
        showingPlaintextEditor = true;
        editorSettingsHTMLEditorRadioButton.setSelected(false);
        editorSettingsPlaintextEditorRadioButton.setSelected(true);
        contentTextArea.setText(contentHTMLEditor.getHtmlText());
        contentTextArea.toFront();
    }

    private void contentShowHTMLEditor() {
        showingHTMLEditor = true;
        showingPlaintextEditor = false;
        editorSettingsHTMLEditorRadioButton.setSelected(true);
        editorSettingsPlaintextEditorRadioButton.setSelected(false);
        contentHTMLEditor.setHtmlText(contentTextArea.getText());
        contentHTMLEditor.toFront();
    }

    @FXML
    private void handleEditorSettingsHTMLEditorRadioButtonAction(ActionEvent event) {
        contentShowHTMLEditor();
    }

    @FXML
    private void handleeditorSettingsPlaintextEditorRadioButtonAction(ActionEvent event) {
        contentShowPlaintextEditor();
    }

    public void setEditorHTML() {
        contentShowHTMLEditor();
    }

    public void setEditorPlaintext() {
        contentShowPlaintextEditor();
    }

    public String getTitle() {
        return (titleTextField.getText());
    }

    public void setTitle(String text) {
        titleTextField.setText(text);
    }

    public String getBody() {
        if (showingHTMLEditor) {
            return (contentHTMLEditor.getHtmlText());
        } else if (showingPlaintextEditor) {
            return (contentTextArea.getText());
        } else {
            return (null);
        }
    }

    public void setBody(String text) {
        if (showingHTMLEditor) {
            contentHTMLEditor.setHtmlText(text);
        } else if (showingPlaintextEditor) {
            contentTextArea.setText(text);
        } else {
        }
    }

    public void clearAll() {
        contentHTMLEditor.setHtmlText("");
        contentTextArea.setText("");
        contentShowHTMLEditor();
        titleTextField.setText("");
    }
}
