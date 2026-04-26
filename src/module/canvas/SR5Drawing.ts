import { isDocumentVisibleForViewer } from '@/module/perception/perceptionState';

export class SR5Drawing extends foundry.canvas.placeables.Drawing {
    override get isVisible(): boolean {
        if (!super.isVisible) return false;
        return isDocumentVisibleForViewer(this.document);
    }
}
