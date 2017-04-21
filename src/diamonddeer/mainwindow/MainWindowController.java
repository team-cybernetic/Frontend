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
package diamonddeer.mainwindow;

import java.util.*;

import beryloctopus.BerylOctopus;
import beryloctopus.Post;
import beryloctopus.User;
/*
import beryloctopus.models.posts.HtmlPost;
import beryloctopus.models.posts.Post;
import beryloctopus.models.posts.TextPost;
import beryloctopus.repositories.UserRepository;
import beryloctopus.repositories.PostRepository;
*/
import diamonddeer.lib.ByteUnitConverter;
import diamonddeer.mainwindow.post.PostUI;
import diamonddeer.mainwindow.post.PostController;
import diamonddeer.mainwindow.post.PostLoader;
import diamonddeer.mainwindow.sidebar.SidebarLoader;
import diamonddeer.settings.PostSettings;
import diamonddeer.lib.Debug;
import diamonddeer.mainwindow.editor.EditorController;
import diamonddeer.mainwindow.editor.EditorLoader;
import diamonddeer.mainwindow.editor.EditorUI;
import diamonddeer.mainwindow.post.comment.PostCommentLoader;
import diamonddeer.mainwindow.post.comment.PostCommentController;
import diamonddeer.mainwindow.post.comment.PostCommentUI;
import diamonddeer.mainwindow.sidebar.SidebarController;
import diamonddeer.mainwindow.sidebar.SidebarUI;
import java.io.IOException;
import java.net.URL;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.ResourceBundle;
import javafx.application.Platform;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Control;
import javafx.scene.control.Label;
import javafx.scene.control.MenuButton;
import javafx.scene.control.OverrunStyle;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleButton;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.text.Font;

/**
 *
 * @author Tootoot222
 */
public class MainWindowController implements Initializable {

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
//    private PostRepository posts;
//    private UserRepository users;
    private User curUser;
    private LinkedList<String> previousAddress;
    private LinkedList<String> forwardAddress;
    private HashMap<String, PostUI> postsUI = new HashMap<>();
    private int earningsGlobal;
    private int earningsLocal;
    
    @FXML
    private Button homeButton;
    @FXML
    private Button optionsButton;
    @FXML
    private ToggleButton bookmarksToggle;
    @FXML
    private Button reloadButton;
    @FXML
    private Button backButton;
    @FXML
    private Button forwardButton;
    @FXML    
    private HBox addressBarHBox;
    @FXML
    private TextField addressBarTextField;
    @FXML
    private MenuButton feedMenuButton;
    @FXML
    private TextField searchTextField;
    @FXML
    private Label earningsGlobalLabel;
    @FXML
    private Label earningsLocalLabel;
    @FXML
    private TextArea newPostTextArea;
    @FXML
    private ToggleButton rollupButton;
    @FXML
    private Button postButton;
    @FXML
    private ScrollPane sidebarPane;
    @FXML
    private AnchorPane rootPane;
    @FXML
    private Button createGroupButton;
    @FXML
    private Label statusLeftLabel;
    @FXML
    private StackPane rollButtonsStackPane;
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

    public void setup(BerylOctopus model, User curUser, EditorLoader editorLoader, PostLoader postLoader, PostCommentLoader postCommentLoader, SidebarLoader sidebarLoader, PostSettings postSettings) throws IOException {
        this.model = model;
        this.curUser = curUser;
        this.postLoader = postLoader;
        this.postCommentLoader = postCommentLoader;
        SidebarUI sidebar = sidebarLoader.loadSidebar();
        this.sidebarController = sidebar.getController();
        this.sidebarPane.setContent(sidebar.getLayout());

        this.postSettings = postSettings;
        EditorUI editor = editorLoader.loadEditor();
        this.editorController = editor.getController();
        this.editorPane = editor.getLayout();
//        this.sidebarPane = sidebar.getLayout();
        loadFonts();
        setCurrentAddress(getCurrentAddress());
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
//        posts = new PostRepository();
//        users = new UserRepository();
        previousAddress = new LinkedList<>();
        forwardAddress = new LinkedList<>();
        earningsGlobal = 123456;
        earningsLocal = 123456;
        setEarningsLocal(earningsLocal);
        setEarningsGlobal(earningsGlobal);
    }

    private void setEarningsGlobal(long bytes) {
        earningsGlobalLabel.setText(ByteUnitConverter.bytesToBinaryUnit(bytes));
    }

    private void setEarningsLocal(long bytes) {
        earningsLocalLabel.setText(ByteUnitConverter.bytesToBinaryUnit(bytes));
    }

    public void tipPost(Post post, long amount) {
        model.tipPost(post, amount);
    }

    private void loadFonts() {
        Font.loadFont(MainWindowController.class.getResource("fonts/Roboto-Regular.ttf").toExternalForm(), 10);
        Font.loadFont(MainWindowController.class.getResource("fonts/fontawesome-webfont.ttf").toExternalForm(), 10);
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

    public String getCurrentAddress() {
        return (model.getCurrentPath().getFullPath());
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
        //Set posts
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
                ToggleButton tb = (ToggleButton)n;
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
                setCurrentAddress((String)newButton.getUserData());
                addressBarAddressButtonsUntoggleExcept(newButton);
                updatePosts();
            } else {
                newButton.setSelected(true);
            }
        });
        newButton.setOnMouseEntered((event) -> {
            setStatus(String.format("Navigate to %s", (String)newButton.getUserData()));
        });
        newButton.setOnMouseExited((event) -> {
            resetStatus();
        });
        children.add(newButton);
        return (newButton);
    }

    public void addressBarAddressButtonsCreate() {
        String[] split = model.getCurrentPathArray();
        if (model.getCurrentPath().equals("/")) {
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

    private String dateTimeFromMillis(long millis) {
        Date date = new Date(millis);
        DateFormat formatter = new SimpleDateFormat("HH:mm:ss dd/MM/yyyy");;
        return (formatter.format(date));
    }

    private void populateSidebar(SidebarController sidebarController, Post post) {
        sidebarController.setTitle(post.getTitle());
        sidebarController.setBody(new String(post.getContent()));

        sidebarController.setDateTime(dateTimeFromMillis(post.getTimestampMillis()));
        sidebarController.setSize(post.getByteSize());
        sidebarController.setValue(post.getValue());
        sidebarController.setTitle(post.getTitle());
        //sidebarController.setContentType(post.getContentType());
        /*
        sidebarPane.getChildren().clear();
        List<Text> textAreas = Arrays.asList(new Text("Title: \n" + postController.getTitle() + "\n"),
                                            new Text("Body: \n" + postController.getBody() + "\n"),
                                            new Text("Username: \n" + postController.getUsername() + "\n"),
                new Text("Date Posted: \n" + postController.getDateTime() + "\n"),
                new Text("Post Size: \n" + postController.getSize() + "\n"),
                new Text("Post Value: \n" + postController.getValue() + "\n"),
                new Text("Post Location: \n" + postController.getLocation() + "\n")
        );
        VBox vBox = new VBox();
        vBox.getChildren().addAll(textAreas);
        sidebarPane.getChildren().addAll(vBox);
        */
    }

    public void gotoPost(PostController postController) {
        // Update address bar:
        addressBarEditEnd(getCurrentAddress() + postController.getTitle() + "/");
        // Update sidebar information here:
        populateSidebar(sidebarController, postController.getPost());
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
            forwardAddress.add(0,getCurrentAddress());
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

    private void populatePost(PostController postController, Post post) {
        postController.setUsername(post.getAuthor().getUsername());
        postController.setDateTime(dateTimeFromMillis(post.getTimestampMillis()));
        postController.setSize(post.getByteSize());
        postController.setValue(post.getValue());
        Post parent = post.getParent();
        postController.setLocation(parent != null ? parent.getPath().getFullPath() : null);
        postController.setMainWindow(this); //coupling
        postController.setTitle(post.getTitle());
        postController.setPost(post);
        
        //TODO: not force feed event handlers into gotoPost
        postController.gotoPost.setOnAction(new EventHandler<ActionEvent>() {
            public void handle(ActionEvent t) {
                gotoPost(postController);
            }
        });

        //TODO: arbitrary javafx elements as body (html, video, etc)
        postController.setBody(new String(post.getContent()));
        /*
        if (k instanceof TextPost || k instanceof HtmlPost) {
        postController.setBody(((TextPost)k).getTextContent());
        }
        */

    }

    private void populatePostComment(PostCommentController commentController, Post post) {
        commentController.setTitle(post.getTitle());
        commentController.setBody(new String(post.getContent()));
        commentController.setUsername(post.getAuthor().getUsername());
        commentController.setDateTime(dateTimeFromMillis(post.getTimestampMillis()));
    }

    private void mainContentShowRollupEditor() {
        rollupButton.setText("\uf078");
        rollupButton.toFront();
        if (editorController.getTitle().trim().length() == 0 && newPostTextArea.getText().trim().length() > 0) {
            editorController.setEditorPlaintext();
            populateRollupEditor(editorController, newPostTextArea.getText());
        }
        newPostTextArea.setText("");
        newPostTextArea.setDisable(true);
        this.mainContentPrevious = (Pane)mainContentPane.getContent();
        mainContentPane.setContent(editorPane);
    }

    private void mainContentHideRollupEditor() {
        rollupButton.setText("\uf077");
        rollupButton.toFront();
        if (editorController.getTitle().trim().length() > 0 && newPostTextArea.getText().trim().length() == 0) {
            newPostTextArea.setText(editorController.getTitle() + "\n" + editorController.getBody());
        }
        newPostTextArea.setDisable(false);
        Pane p = (Pane)mainContentPane.getContent();
        mainContentPane.setContent(mainContentPrevious);
        this.mainContentPrevious = p;
    }

    private void postPaneClear() {
        postFlowPane.getChildren().clear();
    }

    private void postPaneAdd(PostUI post) {
        /*
        postGridPane.add(newPostLayout, postCols, postRows);
        postCols = (postCols + 1) % postSettings.getMaxPostColumns();
        if (postCols == 0) {
            postRows++;
            postGridPane.addRow(postRows);
        }
*/
        postsUI.put(post.getController().getTitle(), post);
        postFlowPane.getChildren().add(post.getLayout());
    }
    
    private void updatePosts() {
        try {
            postPaneClear();
            Debug.debug("Getting all posts for address: %s", getCurrentAddress());
            Post topPost = model.getPostAt(getCurrentAddress());
            if (topPost == null) {
                return;
            }
            populateSidebar(sidebarController, topPost);

            //Set<? extends Post> curContent = posts.getChildrenPostsByAddress(getCurrentAddress());
            Set<Post> curContent = topPost.getSubposts();
            Debug.debug("There are %d posts for address %s", curContent.size(), getCurrentAddress());
            for (Post curPost : curContent) {
                PostUI newPost = postLoader.loadEmptyPost();
                PostController newPostController = newPost.getController();
                populatePost(newPostController, curPost);
                for (Post childPost : curPost.getSubposts()) {
                    PostCommentUI comment = postCommentLoader.loadEmptyPostComment();
                    populatePostComment(comment.getController(), childPost);
                    newPostController.addComment(comment);
                }
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
            //default
            //String postType = "Text Post";
            String contentType;
            String title;
            byte[] content;
            if (mainContentShowingRollupEditor()) {
                mainContentHideRollupEditor();
                title = editorController.getTitle();
                content = editorController.getBody().getBytes();
                contentType = editorController.getContentType();
            } else {
                String[] tSplit = newPostTextArea.getText().split("\n", 2);
                title = tSplit[0];
                content = (tSplit.length > 1 ? tSplit[1] : "").getBytes();
                contentType = "text/plain";
            }
            PostUI newPost = postLoader.loadEmptyPost();
            PostController postController = newPost.getController();
            Post thePost = model.createPost(getCurrentAddress(), title, content, contentType, curUser); //could throw an exception if the model doesn't like it
            populatePost(postController, thePost);
            /*
            Matcher replyMatcher = Pattern.compile("^re:(?<reply>[^/]+)/?(?<title>.*)").matcher(title);
            if (replyMatcher.matches()) {
                String re = replyMatcher.group("reply");
                Debug.debug("this is a reply to: %s", re);
                PostCommentUI comment = postCommentLoader.loadEmptyPostComment();
                PostCommentController commentController = comment.getController();
                String commentTitle = replyMatcher.group("title");
                commentController.setTitle(commentTitle);
                commentController.setBody(postController.getBody());
                commentController.setUsername("1234567890123456789012345678901234");
                commentController.setDateTime("2017/03/25 23:01:39");
                PostUI ePost = getPostByTitle(re);
                if (ePost != null) {
                    ePost.getController().addComment(comment);
                    clearAllInputFields();
                } else {
                    Debug.debug("no such post!");
                }
                return;
            }

            Matcher widthMatcher = Pattern.compile(".*w:(?<width>[0-9]+).*").matcher(postController.getBody());
            if (widthMatcher.matches()) {
                int w = Integer.parseInt(widthMatcher.group("width"));
                Debug.debug("width: %d", w);
                postController.setWidthFactor(w);
            }
            Matcher heightMatcher = Pattern.compile(".*h:(?<height>[0-9]+).*").matcher(postController.getBody());
            if (heightMatcher.matches()) {
                int h = Integer.parseInt(heightMatcher.group("height"));
                Debug.debug("height: %d", h);
                postController.setHeightFactor(h);
            }
            */
            clearAllInputFields();
            //postAddNew(newPost);
            //newPostTextArea.setText("");
            //editorController.clearAll();

            //TODO: pass a callback method in to postController.setTitleAction(this, postController) rather than force feeding it to gotoPost
            /*
            postController.gotoPost.setOnAction(new EventHandler<ActionEvent>() {
                    public void handle(ActionEvent t) {
                        gotoPost(postController);
                    }
                });
            */
            postPaneAdd(newPost);

            /*
            //TODO: this is backwards; we should be asking the model if the post is OK, and then placing it in the UI after it has been validated on the backend
            Post thepost;
            switch(postType) {
                default: //Text posts are default, we can add user post above
                    thepost = new TextPost(postController.getLocation(),
                            postController.getTitle(),
                            curUser,
                            postController.getBody(),
                            System.currentTimeMillis(), 
                            //java.util.Calendar.getInstance().getTime().toString(),
                            posts,new UserRepository());
                    break;
            }
            Debug.debug("adding a new post: %s", getCurrentAddress() + postController.getTitle());
            posts.addPost(getCurrentAddress() + postController.getTitle(), thepost);
            */
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
