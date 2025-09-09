
import argparse, json, os
import pandas as pd, numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.calibration import CalibratedClassifierCV
import joblib

try:
    import shap
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
except Exception as e:
    shap = None

ALGOS = {
    'random_forest': lambda: RandomForestClassifier(n_estimators=200, random_state=42),
    'gradient_boosting': lambda: GradientBoostingClassifier(random_state=42),
    'logistic_regression': lambda: LogisticRegression(max_iter=2000),
    'svm': lambda: SVC(probability=True, kernel='rbf'),
    'decision_tree': lambda: DecisionTreeClassifier(random_state=42),
}

def safe_float(x):
    try: return float(x)
    except: return np.nan

def binarize_if_needed(y):
    u = np.unique(y[~pd.isna(y)])
    if set(u) <= {0,1}: return y.astype(int), 'as_is'
    med = np.nanmedian(y.astype(float))
    yb = (y.astype(float) >= med).astype(int)
    return yb, f'binarized_at_median_{med:.3f}'

def metrics(y, proba, pred):
    acc = accuracy_score(y, pred)
    try: auc = roc_auc_score(y, proba) if proba is not None else None
    except: auc = None
    f1 = f1_score(y, pred) if len(set(y))==2 else None
    return {'accuracy': acc, 'auc': auc, 'f1': f1}

def get_explainer(model, X, algo):
    if shap is None: return None
    try:
        if algo in ('random_forest','gradient_boosting','decision_tree') and hasattr(model, 'predict_proba'):
            return shap.TreeExplainer(model)
        else:
            bg = X.sample(min(50, len(X)), random_state=42)
            return shap.KernelExplainer(model.predict_proba, bg)
    except:
        return None

def train(args):
    df = pd.read_csv(args.dataset)
    feats = [c for c in args.features.split(',') if c] or [c for c in df.columns if c.lower().startswith('q') and c.lower().endswith('_score')]
    tgt = args.target if args.target in df.columns else ('RiskScore' if 'RiskScore' in df.columns else 'TotalScore')
    X = df[feats].applymap(safe_float).fillna(df[feats].applymap(safe_float).median())
    y_raw = df[tgt]
    y, note = binarize_if_needed(y_raw)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=float(args.test_size), random_state=42, stratify=y if len(np.unique(y))==2 else None)

    res = {'target': tgt, 'features': feats, 'target_note': note, 'calibration': args.calibration, 'models': []}
    out_dir = os.path.join('server','uploads','analysis'); os.makedirs(out_dir, exist_ok=True)

    algos = [a.strip() for a in args.algorithms.split(',') if a.strip()]
    for a in algos:
        if a not in ALGOS: continue
        base = ALGOS[a]()
        model = base
        if args.calibration and args.calibration!='none':
            model = CalibratedClassifierCV(base, method='sigmoid' if args.calibration=='sigmoid' else 'isotonic', cv=5)
        model.fit(Xtr, ytr)
        proba = model.predict_proba(Xte)[:,1] if hasattr(model, 'predict_proba') else None
        pred = model.predict(Xte)
        m = metrics(yte, proba, pred)

        # SHAP summary
        shap_png = None
        if shap is not None:
            try:
                ex = get_explainer(model, Xtr, a)
                if ex is not None:
                    Xs = Xtr.sample(min(200,len(Xtr)), random_state=42)
                    sv = ex.shap_values(Xs)
                    if isinstance(sv, list) and len(sv)==2: sv = sv[1]
                    png = os.path.join(out_dir, f'shap_summary_{a}.png')
                    shap.summary_plot(sv, Xs, show=False)
                    plt.tight_layout(); plt.savefig(png, dpi=150); plt.close()
                    shap_png = png
            except Exception as e:
                pass

        # Save bundle
        bundle = {'model': model, 'features': feats, 'target': tgt, 'target_note': note, 'calibration': args.calibration}
        # Save to a temp file so caller can embed if needed
        tmp_path = os.path.join('server','models_store', f'{a}_{int(pd.Timestamp.now().timestamp())}.joblib')
        os.makedirs(os.path.dirname(tmp_path), exist_ok=True)
        joblib.dump(bundle, tmp_path)

        res['models'].append({'algorithm': a, 'metrics': m, 'modelPath': tmp_path, 'shap_summary_png': shap_png})

    print(json.dumps(res))

def shap_dep(args):
    if shap is None: print(json.dumps({'error':'shap_not_available'})); return
    df = pd.read_csv(args.dataset)
    feats = [c for c in args.features.split(',') if c] or [c for c in df.columns if c.lower().startswith('q') and c.lower().endswith('_score')]
    X = df[feats].applymap(safe_float).fillna(df[feats].applymap(safe_float).median())
    Xs = X.sample(min(max(int(args.sample_size),20), len(X)), random_state=42)
    # Use a simple RF for dependence if no model provided
    model = RandomForestClassifier(n_estimators=200, random_state=42).fit(Xs, np.random.randint(0,2,size=(len(Xs),)))
    try:
        ex = shap.TreeExplainer(model)
        out = {}
        out_dir = os.path.join('server','uploads','analysis'); os.makedirs(out_dir, exist_ok=True)
        for f in feats:
            png = os.path.join(out_dir, f'shap_dep_{f}.png')
            shap.dependence_plot(f, ex.shap_values(Xs)[1] if isinstance(ex.shap_values(Xs), list) else ex.shap_values(Xs), Xs, show=False)
            import matplotlib.pyplot as plt
            plt.tight_layout(); plt.savefig(png, dpi=150); plt.close()
            out[f] = png
        print(json.dumps({'images': out}))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', required=True, choices=['train','shap_dep'])
    ap.add_argument('--dataset', required=True)
    ap.add_argument('--target', default='RiskScore')
    ap.add_argument('--features', default='')
    ap.add_argument('--algorithms', default='random_forest,logistic_regression')
    ap.add_argument('--test_size', default='0.2')
    ap.add_argument('--calibration', default='none')
    ap.add_argument('--sample_size', default='200')
    ap.add_argument('--model_path', default=None)
    args = ap.parse_args()

    if args.mode=='train': train(args)
    elif args.mode=='shap_dep': shap_dep(args)

if __name__=='__main__':
    main()
