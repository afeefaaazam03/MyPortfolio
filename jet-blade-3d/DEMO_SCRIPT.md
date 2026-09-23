# A simple two-minute presentation

**0:00–0:25 — The idea.**

“Our question is whether inspection images can tell us where a blade has physically changed, and recover that change in three dimensions. We provide pictures and a healthy 3D blade. The intended output is a location on the surface and an estimated changed mesh.”

**0:25–0:55 — Show the demo.**

Keep example **c033** selected. Point to the two images and the healthy mesh. Rotate the large output.

“These are the actual saved inputs and output from a controlled experiment. The teal region shows estimated surface movement. The point marks the fitted location. The underlying output is a 3D mesh, which we can rotate and inspect.”

**0:55–1:20 — Check the answer.**

Click **Known answer**, then return to **Estimated shape**. Open the mesh-information panel.

“Because this damage was simulated, we know the correct shape and can measure the error. The orange view is that known answer, used only for checking. Locating the correct point does not guarantee the correct dent depth. Our comparison explicitly measures the 3D error.”

**1:20–1:45 — Show the difficult case.**

Choose **Color change only**, example **c021**, and compare the two estimation methods.

“A color patch should not change the blade’s physical shape. Separating color from geometry reduces this type of false movement. But in examples containing both a dent and a color patch, the newer method often estimates the shape less accurately. We keep these failures visible.”

**1:45–2:15 — State progress honestly.**

Scroll to **Where we are**.

“We have completed a controlled workflow, actual mesh outputs, and checked comparisons on 68 synthetic cases from two source shapes. This latest method is a restricted fit, not a trained end-to-end network. The full goal is unfinished. Next we will render the estimated shapes directly to investigate the depth errors, then improve and validate the method. Real-blade accuracy and reliable uncertainty remain future work.”

**If asked whether this is 3D:** “Yes. Both the location and the shape estimate are in 3D. The healthy 3D reference is supplied; we are estimating its change, not reconstructing an unknown blade from scratch.”
