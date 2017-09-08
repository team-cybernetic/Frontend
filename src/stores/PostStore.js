export default class PostStore {
  static createPost(title, text) {
    return {
      title: title,
      text: text,
    };
  }
}
