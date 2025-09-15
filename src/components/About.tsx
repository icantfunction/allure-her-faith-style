const About = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Story Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-section-title mb-6 text-primary">
                Our Story
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Allure Her was born from a divine calling during a season of fasting and prayer. 
                  In a profound dream, the verse from Hosea 2:14 echoed with clarity: 
                  "I will allure her and speak tenderly to her."
                </p>
                <p>
                  This sacred moment revealed the heart of our mission—to create clothing that 
                  honors both the feminine spirit and the call to live in purity and worship. 
                  Every piece is designed to make women feel loved, confident, and seen by their Creator.
                </p>
              </div>
            </div>
            
            <div className="scripture-quote text-center py-6">
              I will allure her and speak tenderly to her
              <div className="text-sm font-body mt-2 text-muted-foreground not-italic">
                — Hosea 2:14
              </div>
            </div>
          </div>
          
          {/* Mission Statement */}
          <div className="bg-gradient-to-br from-secondary to-accent rounded-2xl p-10">
            <h3 className="text-2xl font-heading mb-6 text-primary">
              Our Mission
            </h3>
            <p className="text-foreground leading-relaxed mb-6">
              To inspire women to live in purity and worship while feeling loved and confident. 
              We believe that how we dress can be an act of worship, honoring both our bodies 
              as temples and our call to reflect divine beauty.
            </p>
            <p className="text-muted-foreground italic">
              Fashion that speaks to the soul as much as it dresses the body.
            </p>
          </div>
        </div>
        
        <div className="section-divider"></div>
      </div>
    </section>
  );
};

export default About;