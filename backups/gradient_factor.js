

            
class gradientFactor {
    GFlow = 0;
    GFhigh = 0;
    gfSetFlag = false;
    gfSlope = 0;
    gfCurrent = 0;

    constructor ( GFlow,  GFhigh) {
        this.GFlow = GFlow;
        this.GFhigh = GFhigh;
        this.gfSetFlag = false;
        this.gfSlope = 0.0;
        this.gfCurrent = GFlow;

    }

        
    gfSet( depthNow) {
        if (this.gfSetFlag == false) {
            this.gfSlope = (this.GFhigh - this.GFlow) / depthNow;
            this.gfCurrent = this.GFlow;
            this.gfSetFlag = true;
            return this.GFlow;
        } else {
            this.gfCurrent = this.GFhigh - this.gfSlope * depthNow;
            return this.gfCurrent;
        }
    }

    gfGet(depthNow) {
        if (this.gfSetFlag == false) {
            return this.GFlow;
        } else {
            this.gfCurrent = this.GFhigh - this.gfSlope * depthNow;
            return this.gfCurrent;
        }
    }
}