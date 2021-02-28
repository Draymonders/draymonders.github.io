普通二叉树
```cpp
class Solution {
public:

    TreeNode* ans;
    
    /*
        dfs(root, p, q) 返回是否包含 p或q
        (l && r) 表示分别在两个子树中，此时LCA -> root
        (root == p || root == q) && (l || r) 
            上式说明当前节点是其中一个，且子树里有一个
    */
    bool dfs(TreeNode* root, TreeNode* p, TreeNode* q) {
        if (!root)
            return false;
        bool l = dfs(root->left, p, q);
        bool r = dfs(root->right, p, q);
        // printf("%d %d %d\n", root->val, (int)(l), (int)(r));
        if ((l && r) || ((l || r) && (root == p || root == q))) {
            ans = root;
            return true;
        }
        return (root == p || root == q) || l || r;
    }

    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        ans = NULL;
        dfs(root, p, q);
        return ans;
    }
};
```