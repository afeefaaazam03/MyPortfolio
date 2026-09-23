# English narration

This 96-second walkthrough uses an AI-generated English voice. The narration describes saved prototype outputs; it does not run live inference.

## 00:00

This walkthrough shows our current three-dimensional blade prototype. It uses matching images and a supplied healthy blade shape to estimate how the surface changed.

## 00:12

The inputs are a healthy three-dimensional model, seven matched image pairs, and a supplied mapping from pictures to surface points. The camera setup and healthy reference are already known.

## 00:30

These are saved outputs, not live inference. The crop uses the known damage location for evaluation. Blue marks predicted movement. The model also changes areas that should stay healthy.

## 00:48

We have built controlled examples, trained small shape models, and checked their failures. A separate image-only detector highlights suspected damage in photographs. These are different existing components.

## 01:04

On eighteen simulated dents from two blade instances, the new learned model passed every improvement check in three cases. A fixed rule passed four. These counts are not overall accuracy.

## 01:20

Next, we need more reliable shape changes and tests on untouched cases. Separately, we must test whether adding three-dimensional teaching improves image inspection on new real photographs.

Voice: Piper 1.8.0, en_US-ljspeech-medium. [Voice model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD), [Piper](https://github.com/OHF-Voice/piper1-gpl). See [source attribution](ATTRIBUTION.md).
