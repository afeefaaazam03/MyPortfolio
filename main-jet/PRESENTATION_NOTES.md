# Main Jet — three-minute presentation

Open `index.html#quick-presentation`, choose **Full screen**, and use the arrow keys. The slides distinguish the current 3D prototype from the broader proposal. All displayed outputs are saved examples.

## 1 · The two goals — 25 seconds

We want to understand blade damage in two ways: where it appears in a photograph, and how the blade’s shape has changed. Our current prototype starts with a healthy 3D model and estimates changes from images. Our broader proposal asks whether knowing the 3D damage during training can help an image model find damage in real photographs. These are connected questions, but they need separate experiments.

## 2 · Our data — 30 seconds

We have three kinds of material. First, public blade shapes that we can deliberately dent and photograph virtually. These give us an exact answer for checking the predicted shape. Second, a larger library of computer-made damage images. Third, labelled real photographs and supplied inspection photos. These collections have different uses. Thousands of images do not mean thousands of independent blades, and not every image has matching 3D information.

## 3 · Input and output — 30 seconds

For the current 3D prototype, the inputs are a healthy blade model, seven matching pairs of reference and inspection images, and a known mapping from images to the surface. The model predicts how surface points move, producing an estimated changed shape. Here is an actual saved example. The middle shape is the answer used for checking; the right is the prediction. The prediction spreads beyond the real dent, which shows a problem we still need to solve.

## 4 · Done so far — 25 seconds

We have built controlled examples, trained small models, saved their 3D predictions, and tested simple geometric rules and image misalignment. We also have an existing model that highlights suspected damage in real photographs. That photo model is a separate component: these results do not yet demonstrate the proposed benefit from 3D-assisted training.

## 5 · Latest results — 30 seconds

Our latest check used eighteen simulated dents across two new blade instances, plus healthy controls. Both changes improved shape error against the earlier model, but only three cases for the new learned model and four for the simple rule passed every improvement check. These are not accuracy percentages. False changes and missed damage remain. A better-looking shape or a lower average error is not enough to call the system reliable.

## 6 · What’s next — 25 seconds

For 3D, we need to put the predicted change in the right place without losing real damage, then check new examples and measured real shapes. For the broader proposal, we need a fair comparison: train with images alone versus images plus 3D teaching, and test on new reviewed photographs. We have a working research prototype and useful evidence; the full inspection goal is still ahead.
