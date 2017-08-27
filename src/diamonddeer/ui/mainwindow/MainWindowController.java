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
package diamonddeer.ui.mainwindow;

import beryloctopus.BerylOctopus;
import beryloctopus.Post;
import beryloctopus.UserIdentity;
import diamonddeer.Application;
import diamonddeer.lib.ByteUnitConverter;
import diamonddeer.lib.Debug;
import diamonddeer.settings.PostSettings;
import diamonddeer.ui.editor.EditorController;
import diamonddeer.ui.editor.EditorLoader;
import diamonddeer.ui.editor.EditorUI;
import diamonddeer.ui.post.PostController;
import diamonddeer.ui.post.PostLoader;
import diamonddeer.ui.post.PostUI;
import diamonddeer.ui.postcomment.PostCommentLoader;
import diamonddeer.ui.sidebar.SidebarController;
import diamonddeer.ui.sidebar.SidebarLoader;
import diamonddeer.ui.sidebar.SidebarUI;
import javafx.application.Platform;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.text.Font;

import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.ResourceBundle;
import java.util.Set;

public class MainWindowController implements Initializable, PostViewer {
    private BerylOctopus model;
    private PostLoader postLoader;
    private PostCommentLoader postCommentLoader;
    private PostSettings postSettings;
    private ObservableList<Node> addressBarChildren = null;
    private String oldAddressText = null;
    private Pane mainContentPrevious = null;
    private Pane editorPane;
    private EditorController editorController;
    private SidebarController sidebarController;
    private UserIdentity curUser;
    private LinkedList<String> previousAddress;
    private LinkedList<String> forwardAddress;
    private HashMap<String, PostUI> postsUI = new HashMap<>();
    private int earningsGlobal;
    private int earningsLocal;

    @FXML
    private HBox addressBarHBox;
    @FXML
    private TextField addressBarTextField;
    @FXML
    private Label earningsGlobalLabel;
    @FXML
    private Label earningsLocalLabel;
    @FXML
    private TextArea newPostTextArea;
    @FXML
    private ToggleButton rollupButton;
    @FXML
    private ScrollPane sidebarPane;
    @FXML
    private AnchorPane rootPane;
    @FXML
    private Label statusLeftLabel;
    @FXML
    private ScrollPane addressBarScrollPane;
    @FXML
    private Button addressBarCancelButton;
    @FXML
    private Button addressBarGoButton;
    @FXML
    private ScrollPane mainContentPane;
    @FXML
    private FlowPane postFlowPane;

    private void setDefaultFocus() {
        Platform.runLater(() -> rootPane.requestFocus());
    }

    private void setStatus(String newStatus) {
        statusLeftLabel.setText(newStatus);
    }

    private void resetStatus() {
        statusLeftLabel.setText("");
    }

    public void setup(BerylOctopus model, UserIdentity curUser, EditorLoader editorLoader, PostLoader postLoader, PostCommentLoader postCommentLoader, SidebarLoader sidebarLoader, PostSettings postSettings) throws IOException {
        this.model = model;
        this.curUser = curUser;
        this.postLoader = postLoader;
        this.postCommentLoader = postCommentLoader;

        PostController.setPostCommentLoader(postCommentLoader);

        SidebarUI sidebar = sidebarLoader.loadSidebar();
        this.sidebarController = sidebar.getController();
        this.sidebarPane.setContent(sidebar.getLayout());

        this.postSettings = postSettings;
        EditorUI editor = editorLoader.loadEditor();
        this.editorController = editor.getController();
        this.editorPane = editor.getLayout();

        loadFonts();
        setCurrentAddress(getCurrentAddress());
        setEarningsLocal(model.getValueLocal(curUser)); //TODO
        setEarningsGlobal(model.getValueGlobal(curUser));
        addressBarAddressButtonsCreate();
        updatePosts();
        setDefaultFocus();
    }

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        addressBarEditButtonsHide();
        addressBarTextField.focusedProperty().addListener((arg0, oldV, focusGained) -> {
            if (focusGained != null) {
                if (focusGained) {
                    addressBarEditBegin();
                } else { //focus lost
                    if (!addressBarGoButton.isFocused()) {
                        addressBarEditCancel();
                    } else {
                        addressBarEditConfirm();
                    }
                }
            }
        });
        addressBarHBox.widthProperty().addListener((observable, oldH, newH) -> {
            addressBarScrollPane.setHvalue(addressBarScrollPane.getHmax());
        });
        mainContentPrevious = postFlowPane;
        previousAddress = new LinkedList<>();
        forwardAddress = new LinkedList<>();
    }

    private void setEarningsGlobal(long bytes) {
        earningsGlobalLabel.setText(ByteUnitConverter.bytesToUnit(bytes));
    }

    private void setEarningsLocal(long bytes) {
        earningsLocalLabel.setText(ByteUnitConverter.bytesToUnit(bytes));
    }

    public void tipPost(Post post, long amount) {
        model.tipPost(post, amount);
    }

    private void loadFonts() {
        Font.loadFont(Application.class.getResource("assets/fonts/Roboto-Regular.ttf").toExternalForm(), 10);
        Font.loadFont(Application.class.getResource("assets/fonts/fontawesome-webfont.ttf").toExternalForm(), 10);
    }

    public String getCurrentAddress() {
        return (model.getCurrentPath().getFullPath());
    }

    public void setCurrentAddress(String address) {
        try {
            previousAddress.add(0, getCurrentAddress());
            model.setCurrentPath(address.replaceAll("/\\/+/", "/"));
        } catch (Exception ex) {
            Debug.error("Exception while trying to change current address path: %s", ex.toString());
            //TODO: show some sort of prompt or window notifying the user of the problem
        }
    }

    private void addressBarClearText() {
        addressBarTextField.setText("");
    }

    private void addressBarEditBegin() {
        addressBarAddressButtonsClear();
        addressBarEditButtonsShow();
        String addr = getCurrentAddress();
        this.oldAddressText = addr;
        addressBarTextField.setText(addr);
        Platform.runLater(() -> {
            addressBarTextField.positionCaret(0);
            addressBarTextField.selectAll();
        });
    }

    private void addressBarEditEnd(String text) {
        if (text != null && text.length() > 0) {
            setCurrentAddress(text);
            addressBarClearText();
            addressBarAddressButtonsCreate();
        }
        oldAddressText = null;
        addressBarEditButtonsHide();
        updatePosts();
        setDefaultFocus();
    }

    private void addressBarEditCancel() {
        addressBarEditEnd(oldAddressText);
    }

    private void addressBarEditConfirm() {
        addressBarEditEnd(addressBarTextField.getText());
    }

    private void addressBarEditButtonsHide() {
        addressBarCancelButton.setManaged(false);
        addressBarCancelButton.setVisible(false);
        addressBarGoButton.setManaged(false);
        addressBarGoButton.setVisible(false);
    }

    private void addressBarEditButtonsShow() {
        addressBarCancelButton.setManaged(true);
        addressBarCancelButton.setVisible(true);
        addressBarGoButton.setManaged(true);
        addressBarGoButton.setVisible(true);
    }

    private ObservableList<Node> addressBarGetAddressButtons() {
        if (addressBarChildren == null) {
            addressBarChildren = addressBarHBox.getChildren();
        }
        return (addressBarChildren);
    }

    private void addressBarAddressButtonsClear() {
        ObservableList<Node> children = addressBarGetAddressButtons();
        children.clear();
    }

    private void addressBarAddressButtonsUntoggleExcept(ToggleButton except) {
        ObservableList<Node> children = addressBarGetAddressButtons();
        for (Node n : children) {
            if (n instanceof ToggleButton) {
                ToggleButton tb = (ToggleButton) n;
                if (except == null || !tb.equals(except)) {
                    tb.setSelected(false);
                }
            }
        }
    }

    private void addressBarAddressButtonsUntoggleAll() {
        addressBarAddressButtonsUntoggleExcept(null);
    }

    private ToggleButton addressBarAddressButtonsAppend(String buttonText, String path, String pos) {
        ObservableList<Node> children = addressBarGetAddressButtons();
        ToggleButton newButton = new ToggleButton(buttonText);
        newButton.getStyleClass().add("address-bar");
        if (pos != null) newButton.getStyleClass().add(pos);
        newButton.setUserData(path);
        newButton.setTextOverrun(OverrunStyle.CLIP);
        newButton.setMinWidth(Control.USE_PREF_SIZE);
        newButton.setOnAction((event) -> {
            if (newButton.isSelected()) {
                setCurrentAddress((String) newButton.getUserData());
                addressBarAddressButtonsUntoggleExcept(newButton);
                updatePosts();
            } else {
                newButton.setSelected(true);
            }
        });
        newButton.setOnMouseEntered((event) -> {
            setStatus(String.format("Navigate to %s", (String) newButton.getUserData()));
        });
        newButton.setOnMouseExited((event) -> {
            resetStatus();
        });
        children.add(newButton);
        return (newButton);
    }

    public void addressBarAddressButtonsCreate() {
        String[] split = model.getCurrentPathArray();
        if (split.length == 0) {
            split = new String[]{""};
        }
        String sep = model.getPathSeparator();
        StringBuilder fullPath = new StringBuilder();

        addressBarAddressButtonsClear();
        ToggleButton lastButton = null;
        for (int i = 0; i < split.length; i++) {
            String subSplit = split[i];
            fullPath.append(subSplit + sep);
            String pos = null;
            if (i == 0) {
                pos = "first";
            } else if (i == split.length - 1) {
                pos = "last";
            }
            lastButton = addressBarAddressButtonsAppend(subSplit + sep, fullPath.toString(), pos);
        }
        if (lastButton != null) {
            lastButton.setSelected(true);
        }
    }

    public void viewPost(Post post) {
        // Update address bar:
        addressBarEditEnd(post.getPath().getFullPath());
    }

    public void changeEarnings(int change) {
        earningsLocal += change;
        setEarningsLocal(earningsLocal);
        earningsGlobal += change;
        setEarningsGlobal(earningsGlobal);
    }


    @FXML
    private void handleHomeButtonAction(ActionEvent event) {
    }

    @FXML
    private void handleOptionsButtonAction(ActionEvent event) {
    }

    @FXML
    private void handleBookmarksToggleAction(ActionEvent event) {
        ToggleButton button = (ToggleButton) event.getSource();
        if (button.isSelected()) {
            button.setText("\uf02e");
        } else {
            button.setText("\uf097");
        }
    }

    @FXML
    private void handleReloadButtonAction(ActionEvent event) {
        updatePosts();
    }

    @FXML
    private void handleBackButtonAction(ActionEvent event) {
        if (previousAddress.size() > 0) {
            forwardAddress.add(0, getCurrentAddress());
            addressBarEditEnd(previousAddress.remove());
            previousAddress.remove();
        }
    }

    @FXML
    private void handleForwardButtonAction(ActionEvent event) {
        if (forwardAddress.size() > 0) {
            addressBarEditEnd(forwardAddress.remove());
        }
    }

    @FXML
    private void handleAddressBarTextFieldAction(ActionEvent event) {
        addressBarEditConfirm();
    }

    @FXML
    private void handleFeedMenuButtonAction(ActionEvent event) {
    }

    @FXML
    private void handleSearchTextFieldAction(ActionEvent event) {
    }

    @FXML
    private void handleRollupButtonAction(ActionEvent event) {
        ToggleButton button = (ToggleButton) event.getSource();
        if (button.isSelected()) {
            mainContentShowRollupEditor();
        } else {
            mainContentHideRollupEditor();
        }
    }

    private void populateRollupEditor(EditorController editorController, String text) {
        String[] tSplit = text.split("\n", 2);
        editorController.setTitle(tSplit[0]);
        editorController.setBody(tSplit.length > 1 ? tSplit[1] : "");
    }

    private void populatePost(PostController postController, Post post) throws IOException {
        postController.setTipSource(curUser);
        postController.setPostViewer(this);
        postController.setPost(post);
    }

    private void mainContentShowRollupEditor() {
        rollupButton.setText("\uf078");
        if (editorController.getTitle().trim().length() == 0 && newPostTextArea.getText().trim().length() > 0) {
            editorController.setEditorPlaintext();
            populateRollupEditor(editorController, newPostTextArea.getText());
        }
        newPostTextArea.setText("");
        newPostTextArea.setDisable(true);
        this.mainContentPrevious = (Pane) mainContentPane.getContent();
        mainContentPane.setContent(editorPane);
    }

    private void mainContentHideRollupEditor() {
        rollupButton.setText("\uf077");
        if (editorController.getTitle().trim().length() > 0 && newPostTextArea.getText().trim().length() == 0) {
            newPostTextArea.setText(editorController.getTitle() + "\n" + editorController.getBody());
        }
        newPostTextArea.setDisable(false);
        Pane p = (Pane) mainContentPane.getContent();
        mainContentPane.setContent(mainContentPrevious); //TODO: previous or postsPane?
        this.mainContentPrevious = p;
    }

    private void postPaneClear() {
        postFlowPane.getChildren().clear();
        postsUI.clear();
    }

    private void postPaneAdd(PostUI post) {
        postsUI.put(post.getController().getPost().getTitle(), post); //horrible chaining
        postFlowPane.getChildren().add(post.getLayout());
    }

    private void updatePosts() {
        try {
            postPaneClear();
            Post curPost = model.getPostAt(getCurrentAddress());
            if (curPost == null) {
                return;
            }
            sidebarController.setPost(curPost);
            Set<Post> curContent = curPost.getSubposts();
            for (Post subPost : curContent) {
                PostUI newPost = postLoader.loadEmptyPost();
                PostController newPostController = newPost.getController();
                populatePost(newPostController, subPost);
                postPaneAdd(newPost);
            }
        } catch (IOException e) {
            Debug.debug("IOException while reloading posts: %s", e.toString());
        }
    }

    private boolean mainContentShowingRollupEditor() {
        return (mainContentPane.getContent().equals(editorPane));
    }

    private void clearAllInputFields() {
        newPostTextArea.setText("");
        editorController.clearAll();
    }

    private PostUI getPostByTitle(String title) {
        return (postsUI.get(title));
    }

    @FXML
    private void handlePostButtonAction(ActionEvent event) throws Exception {
        try {
            String contentType;
            String title;
            byte[] content;
            if (mainContentShowingRollupEditor()) {
                mainContentHideRollupEditor();
                rollupButton.selectedProperty().set(false);
                title = editorController.getTitle();
                content = editorController.getBody().getBytes();
                contentType = editorController.getContentType();
            } else {
                String[] tSplit = newPostTextArea.getText().split("\n", 2);
                title = tSplit[0];
                content = (tSplit.length > 1 ? tSplit[1] : "").getBytes();
                contentType = "text/plain"; //TODO: MIME factory
            }
            Post thePost = model.createPost(getCurrentAddress(), title, content, contentType, curUser); //could throw an exception if the model doesn't like it
            PostUI newPost = postLoader.loadEmptyPost();
            PostController postController = newPost.getController();
            populatePost(postController, thePost);
            clearAllInputFields();
            postPaneAdd(newPost);
        } catch (IOException ex) {
            Debug.debug("IOException while loading empty post: %s", ex.toString());
            throw (ex);
        }
    }

    @FXML
    private void handleHomeButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleHomeButtonMouseEntered(MouseEvent event) {
        setStatus("Go to your home page");
    }

    @FXML
    private void handleOptionsButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleOptionsButtonMouseEntered(MouseEvent event) {
        setStatus("Open the options menu");
    }

    @FXML
    private void handleBookmarksToggleMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleBookmarksToggleMouseEntered(MouseEvent event) {
        setStatus("Toggle bookmarks bar visibility");
    }

    @FXML
    private void handleReloadButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleReloadButtonMouseEntered(MouseEvent event) {
        setStatus("Reload the current page");
    }

    @FXML
    private void handleBackButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleBackButtonMouseEntered(MouseEvent event) {
        setStatus("Go back to the last page viewed");
    }

    @FXML
    private void handleForwardButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleForwardButtonMouseEntered(MouseEvent event) {
        setStatus("Go forward (undo last back button press)");
    }

    @FXML
    private void handleAddressBarTextFieldMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleAddressBarTextFieldMouseEntered(MouseEvent event) {
        setStatus("Manually edit the current address path");
    }

    @FXML
    private void handleCreateGroupButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleCreateGroupButtonMouseEntered(MouseEvent event) {
        setStatus("Create a new group");
    }

    @FXML
    private void handleFeedMenuButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleFeedMenuButtonMouseEntered(MouseEvent event) {
        setStatus("Change feed settings");
    }

    @FXML
    private void handleRollupButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handleRollupButtonMouseEntered(MouseEvent event) {
        ToggleButton button = (ToggleButton) event.getSource();
        if (button.isSelected()) {
            setStatus("Hide the rollup editor");
        } else {
            setStatus("Show the rollup editor");
        }
    }

    @FXML
    private void handlePostButtonMouseExited(MouseEvent event) {
        resetStatus();
    }

    @FXML
    private void handlePostButtonMouseEntered(MouseEvent event) {
        setStatus("Preview new post before creating");
    }

    @FXML
    private void handleAddressBarTextFieldKeyPress(KeyEvent event) {
        if (event.getCode() == KeyCode.ESCAPE) {
            addressBarEditCancel();
            setDefaultFocus();
        }
    }

    @FXML
    private void handleAddressBarCancelButtonAction(ActionEvent event) {
        addressBarEditCancel();
        setDefaultFocus();
    }

    @FXML
    private void handleAddressBarGoButtonAction(ActionEvent event) {
        addressBarEditConfirm();
    }
}
