
import argparse, json, numpy as np

# allow both joblib and pickle
def load_model(path):
    try:
        import joblib
        return joblib.load(path)
    except Exception:
        import pickle, gzip, io
        with open(path, 'rb') as f:
            data = f.read()
        try:
            return pickle.loads(data)
        except Exception:
            try:
                return pickle.load(open(path, 'rb'))
            except Exception as e:
                raise e

def predict_one(bundle, feat_names, feats_map):
    model = bundle['model'] if isinstance(bundle, dict) and 'model' in bundle else bundle
    names = feat_names or (bundle.get('features') if isinstance(bundle, dict) else None)
    if names is None:
        # fallback: use keys sorted
        names = sorted(feats_map.keys())
    x = [feats_map.get(f, 0.0) for f in names]
    X = np.array(x, dtype=float).reshape(1, -1)
    proba = model.predict_proba(X)[:,1].tolist()[0] if hasattr(model,'predict_proba') else None
    pred = int(model.predict(X)[0])
    return {'pred': pred, 'proba': proba, 'used_features': names}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--features', required=True, help='JSON map OR JSON array of maps')
    ap.add_argument('--batch', action='store_true')
    args = ap.parse_args()

    bundle = load_model(args.model)
    feat_names = None
    if isinstance(bundle, dict):
        feat_names = bundle.get('features')

    feats = json.loads(args.features)
    if args.batch:
        results = [predict_one(bundle, feat_names, m) for m in feats]
        print(json.dumps(results))
    else:
        out = predict_one(bundle, feat_names, feats)
        print(json.dumps(out))

if __name__ == '__main__':
    main()
