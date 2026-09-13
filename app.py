from flask import Flask
from services.image_forensics import generate_sample_images
from routes.main_routes import main_bp
from routes.email_routes import email_bp
from routes.image_routes import image_bp
from routes.network_routes import network_bp
from routes.export_routes import export_bp

def create_app():
    """
    Application factory for Cyber Forensics Investigation Platform.
    Registers blueprints and sets up required static demo assets.
    """
    app = Flask(__name__)
    
    # Register Modular Blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(image_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(export_bp)
    
    # Generate sample assets for demonstration
    with app.app_context():
        try:
            generate_sample_images(app.static_folder)
        except Exception as e:
            print(f"Warning: Could not pre-generate sample images: {e}")
            
    return app

app = create_app()

if __name__ == '__main__':
    # Start local development server
    app.run(host='127.0.0.1', port=5000, debug=True)
