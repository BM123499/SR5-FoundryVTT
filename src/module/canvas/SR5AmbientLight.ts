import { isDocumentVisibleForViewer } from '@/module/perception/perceptionState';

export class SR5AmbientLight extends foundry.canvas.placeables.AmbientLight {
    override _isLightSourceDisabled(): boolean {
        if (super._isLightSourceDisabled()) return true;
        if (!canvas?.ready) return false;
        return !isDocumentVisibleForViewer(this.document);
    }
}
